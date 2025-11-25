import { supabase } from '@/integrations/supabase/client';
import { offlineStorage, OfflineAction } from './offlineStorage';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

class SyncManager {
    private isSyncing = false;
    private isOnline = navigator.onLine;

    constructor() {
        this.initNetworkListener();
    }

    private async initNetworkListener() {
        if (Capacitor.isNativePlatform()) {
            const status = await Network.getStatus();
            this.isOnline = status.connected;

            Network.addListener('networkStatusChange', (status) => {
                console.log('🌐 [SyncManager] Network status changed:', status.connected);
                this.isOnline = status.connected;
                if (this.isOnline) {
                    this.sync();
                }
            });
        } else {
            window.addEventListener('online', () => {
                console.log('🌐 [SyncManager] Browser online');
                this.isOnline = true;
                this.sync();
            });
            window.addEventListener('offline', () => {
                console.log('🌐 [SyncManager] Browser offline');
                this.isOnline = false;
            });
        }
    }

    public async sync() {
        if (this.isSyncing || !this.isOnline) return;

        try {
            this.isSyncing = true;
            const actions = await offlineStorage.getPendingActions();

            if (actions.length === 0) {
                console.log('✅ [SyncManager] No pending actions to sync');
                return;
            }

            console.log(`🔄 [SyncManager] Syncing ${actions.length} actions...`);

            for (const action of actions) {
                try {
                    await this.processAction(action);
                    await offlineStorage.removeAction(action.id);
                    console.log(`✅ [SyncManager] Action ${action.id} synced successfully`);
                } catch (error) {
                    console.error(`❌ [SyncManager] Failed to sync action ${action.id}:`, error);
                    // Optional: Implement max retries or move to dead-letter queue
                }
            }
        } catch (error) {
            console.error('❌ [SyncManager] Sync failed:', error);
        } finally {
            this.isSyncing = false;
        }
    }

    private async processAction(action: OfflineAction) {
        switch (action.type) {
            case 'LOG_WEIGHT':
                await this.processLogWeight(action);
                break;
            case 'LOG_MEAL':
                await this.processLogMeal(action);
                break;
            case 'ADD_CUSTOM_MEAL':
                await this.processAddCustomMeal(action);
                break;
            default:
                console.warn(`⚠️ [SyncManager] Unknown action type: ${action.type}`);
        }
    }

    private async processAddCustomMeal(action: OfflineAction) {
        const { mealId, mealData, nutritionPlanId } = action.payload;
        const userId = action.userId;

        console.log('🍱 [SyncManager] Syncing custom meal:', { mealId, name: mealData.name });

        // 1. Insert into meals table with the PRE-GENERATED ID
        const { data: meal, error: mealError } = await supabase
            .from('meals')
            .insert({
                id: mealId, // ✅ Use the same ID generated offline
                name: mealData.name,
                time: mealData.time || null,
                meal_type: mealData.meal_type,
                calories: parseFloat(mealData.calories),
                protein: parseFloat(mealData.protein) || 0,
                carbs: parseFloat(mealData.carbs) || 0,
                fat: parseFloat(mealData.fat) || 0,
                portion_amount: parseFloat(mealData.portion_amount) || 100,
                portion_unit: mealData.portion_unit || 'g',
                created_by: userId,
                foods: []
            })
            .select()
            .single();

        if (mealError) {
            // If error is "duplicate key", it means it was already synced (maybe race condition), so we can ignore?
            // But usually we should throw to retry.
            // However, if we retry a duplicate insert, it will fail forever.
            if (mealError.code === '23505') { // Unique violation
                console.warn('[SyncManager] Meal already exists, skipping insert:', mealId);
            } else {
                throw mealError;
            }
        }

        // 2. Update meal plan
        const { data: plan, error: planError } = await supabase
            .from('meal_plans')
            .select('meals_data')
            .eq('id', nutritionPlanId)
            .single();

        if (planError) throw planError;

        const currentMealsData = (plan.meals_data as any[]) || [];

        // Check if already added to plan
        const alreadyInPlan = currentMealsData.some((m: any) => m.meal_id === mealId);
        if (alreadyInPlan) {
            console.log('[SyncManager] Meal already in plan, skipping update');
            return;
        }

        const updatedMealsData = [...currentMealsData, { meal_id: mealId, added_at: new Date().toISOString() }];

        const { error: updateError } = await supabase
            .from('meal_plans')
            .update({ meals_data: updatedMealsData })
            .eq('id', nutritionPlanId);

        if (updateError) throw updateError;
    }

    private async processLogWeight(action: OfflineAction) {
        const { weight, date } = action.payload;
        const userId = action.userId;

        console.log('⚖️ [SyncManager] Syncing weight:', { weight, date });

        const { error } = await supabase
            .from('progress')
            .insert({
                user_id: userId,
                type: 'weight',
                value: weight,
                unit: 'kg',
                date: date
            });

        if (error) throw error;
    }

    private async processLogMeal(action: OfflineAction) {
        const { mealPlanItemId, consumed, notes, mealData } = action.payload;
        const userId = action.userId;

        console.log('🍎 [SyncManager] Syncing meal:', { mealPlanItemId, consumed });

        if (!mealData) {
            throw new Error('Missing mealData in payload');
        }

        // Logic duplicated from useMyNutrition.ts but adapted for sync
        // We need to check if a log already exists remotely to decide between insert/update/delete
        // However, relying on remote state might be tricky if multiple actions happened.
        // But since we process sequentially, we should check current remote state.

        // Check if log exists for this meal item on this day
        const today = new Date(action.timestamp).toISOString().split('T')[0]; // Use action timestamp for date accuracy

        const { data: existingLogs } = await supabase
            .from('meal_logs')
            .select('id')
            .eq('user_id', userId)
            .eq('meal_plan_item_id', mealPlanItemId)
            .gte('date', `${today}T00:00:00`)
            .lt('date', `${today}T23:59:59`)
            .limit(1);

        const existingLog = existingLogs?.[0];

        if (existingLog) {
            if (!consumed) {
                // DELETE
                const { error } = await supabase
                    .from('meal_logs')
                    .delete()
                    .eq('id', existingLog.id);
                if (error) throw error;
            } else {
                // UPDATE
                const { error } = await supabase
                    .from('meal_logs')
                    .update({
                        consumed,
                        notes,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingLog.id);
                if (error) throw error;
            }
        } else if (consumed) {
            // INSERT
            const mealLogData = {
                user_id: userId,
                meal_plan_id: mealData.meal_plan_id,
                meal_plan_item_id: mealPlanItemId,
                meal_name: mealData.meal_name,
                date: new Date().toISOString(),
                consumed: true,
                notes,
                actual_time: new Date().toISOString()
            };

            const { error } = await supabase
                .from('meal_logs')
                .insert(mealLogData);

            if (error) throw error;
        }
    }
}

export const syncManager = new SyncManager();
