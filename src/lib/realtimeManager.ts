/**
 * 🔗 REALTIME MANAGER CENTRALIZADO (Student App)
 * 
 * Sistema de gerenciamento unificado de Supabase Realtime Subscriptions
 * 
 * OBJETIVO: Reduzir canais e prevenir "Excesso de canais"
 * ARQUITETURA: Singleton pattern com multiplexing de canais
 */

import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

type PostgresChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';
type TableName = string;
type EventType = PostgresChangeEvent;
type ListenerCallback = (payload: any) => void;

interface ChannelConfig {
    table: TableName;
    schema?: string;
    filter?: string;
}

interface ListenerKey {
    id: string;
    table: TableName;
    event: EventType;
    filter?: string;
    callback: ListenerCallback;
}

class RealtimeManager {
    private static instance: RealtimeManager;
    private channels = new Map<TableName, RealtimeChannel>();
    private listeners = new Map<string, Set<ListenerCallback>>();
    private listenerMetadata = new Map<string, ListenerKey>();
    private nextListenerId = 0;

    private constructor() {
        logger.info('RealtimeManager', 'Inicializado (Singleton)');
    }

    static getInstance(): RealtimeManager {
        if (!RealtimeManager.instance) {
            RealtimeManager.instance = new RealtimeManager();
        }
        return RealtimeManager.instance;
    }

    private getListenerKey(table: TableName, event: EventType, filter?: string): string {
        return `${table}:${event}${filter ? `:${filter}` : ''}`;
    }

    private getOrCreateChannel(config: ChannelConfig): RealtimeChannel {
        const { table } = config;

        if (this.channels.has(table)) {
            return this.channels.get(table)!;
        }

        logger.info('RealtimeManager', `Criando channel unificado para tabela: ${table}`);

        const channel = supabase.channel(`unified-student-${table}`);

        this.channels.set(table, channel);

        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                logger.info('RealtimeManager', `Channel ${table} conectado`);
            } else if (status === 'CHANNEL_ERROR') {
                // Reduce noise for expected RLS errors during auth transitions
                logger.warn('RealtimeManager', `Problema no channel ${table} (possível RLS ou conexão)`);
                this.channels.delete(table);
            } else if (status === 'TIMED_OUT') {
                logger.warn('RealtimeManager', `Timeout no channel ${table}`);
                this.channels.delete(table);
            }
        });

        return channel;
    }

    private addPostgresListener(
        channel: RealtimeChannel,
        config: ChannelConfig,
        event: EventType,
        callback: ListenerCallback
    ) {
        const { table, schema = 'public', filter } = config;

        const changeConfig: any = {
            event: event === '*' ? '*' : (event as any),
            schema,
            table,
        };

        if (filter) {
            changeConfig.filter = filter;
        }

        channel.on(
            'postgres_changes' as any,
            changeConfig,
            (payload: any) => {
                const key = this.getListenerKey(table, event, filter);
                const eventListeners = this.listeners.get(key);

                if (eventListeners) {
                    eventListeners.forEach(cb => {
                        try {
                            cb(payload);
                        } catch (error) {
                            logger.error('RealtimeManager', 'Erro ao executar listener', error);
                        }
                    });
                }
            }
        );
    }

    subscribe(
        table: TableName,
        event: EventType,
        callback: ListenerCallback,
        filter?: string
    ): string {
        const listenerId = `listener-${this.nextListenerId++}`;
        const key = this.getListenerKey(table, event, filter);

        this.listenerMetadata.set(listenerId, { id: listenerId, table, event, filter, callback });

        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());

            const channel = this.getOrCreateChannel({ table, filter });
            this.addPostgresListener(channel, { table, filter }, event, callback);
        }

        this.listeners.get(key)!.add(callback);

        logger.info('RealtimeManager', `Listener registrado: ${table}.${event} [${listenerId}]`);

        return listenerId;
    }

    unsubscribe(listenerId: string): void {
        const metadata = this.listenerMetadata.get(listenerId);

        if (!metadata) return;

        const key = this.getListenerKey(metadata.table, metadata.event, metadata.filter);
        const eventListeners = this.listeners.get(key);

        if (eventListeners) {
            eventListeners.delete(metadata.callback);

            if (eventListeners.size === 0) {
                this.listeners.delete(key);
            }
        }

        this.listenerMetadata.delete(listenerId);
        logger.info('RealtimeManager', `Listener removido: ${listenerId}`);
    }

    unsubscribeAll(): void {
        this.channels.forEach((channel) => supabase.removeChannel(channel));
        this.channels.clear();
        this.listeners.clear();
        this.listenerMetadata.clear();
        logger.info('RealtimeManager', 'Limpeza completa realizada');
    }
}

export const realtimeManager = RealtimeManager.getInstance();
