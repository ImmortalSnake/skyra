import { SettingsUpdateResults } from '@klasa/settings-gateway';
import { CommonQuery } from '@lib/queries/common';
import { GiveawayManager } from '@lib/structures/GiveawayManager';
import { IPCMonitorStore } from '@lib/structures/IPCMonitorStore';
import { UserTags } from '@utils/Cache/UserTags';
import { ConnectFourManager } from '@utils/Games/ConnectFourManager';
import { Leaderboard } from '@utils/Leaderboard';
import { LongLivingReactionCollector } from '@utils/LongLivingReactionCollector';
import { Twitch } from '@utils/Notifications/Twitch';
import { FSWatcher } from 'chokidar';
import { PermissionString } from 'discord.js';
import { KlasaMessage, KlasaUser, SettingsFolderUpdateOptions } from 'klasa';
import { BaseNodeOptions, Node as Lavalink } from 'lavalink';
import { Client as VezaClient } from 'veza';
import { APIUserData, WSGuildMemberUpdate } from './DiscordAPI';
import { Events } from './Enums';
import { LanguageKeys } from './Languages';
import { CustomGet } from './settings/Shared';

declare module 'discord.js' {

	interface Client {
		version: string;
		leaderboard: Leaderboard;
		ipcMonitors: IPCMonitorStore;
		giveaways: GiveawayManager;
		connectFour: ConnectFourManager;
		lavalink: Lavalink | null;
		userTags: UserTags;
		llrCollectors: Set<LongLivingReactionCollector>;
		ipc: VezaClient;
		webhookError: Webhook;
		fsWatcher: FSWatcher | null;
		queries: CommonQuery;
		twitch: Twitch;

		emit(event: Events.GuildAnnouncementSend | Events.GuildAnnouncementEdit, message: KlasaMessage, resultMessage: KlasaMessage, channel: TextChannel, role: Role, content: string): boolean;
		emit(event: Events.GuildAnnouncementError, message: KlasaMessage, channel: TextChannel, role: Role, content: string, error: any): boolean;
		emit(event: Events.MoneyTransaction, target: User, moneyChange: number, moneyBeforeChange: number): boolean;
		emit(event: Events.MoneyPayment, message: KlasaMessage, user: KlasaUser, target: KlasaUser, money: number): boolean;
		emit(event: string | symbol, ...args: any[]): boolean;
	}

	interface MessageExtendablesAskOptions {
		time?: number;
		max?: number;
	}

	interface Message {
		prompt(content: string, time?: number): Promise<Message>;
		ask(options?: MessageOptions, promptOptions?: MessageExtendablesAskOptions): Promise<boolean>;
		ask(content: string, options?: MessageOptions, promptOptions?: MessageExtendablesAskOptions): Promise<boolean>;
		alert(content: string, timer?: number): Promise<Message>;
		alert(content: string, options?: number | MessageOptions, timer?: number): Promise<Message>;
		nuke(time?: number): Promise<Message>;
	}

	interface TextChannel {
		sniped: Message | null;
	}

	interface GuildMember {
		fetchRank(): Promise<number>;
		isDJ: boolean;
		isStaff: boolean;
		isMod: boolean;
		isAdmin: boolean;

		_patch(data: WSGuildMemberUpdate): void;
	}

	interface User {
		profileLevel: number;
		fetchRank(): Promise<number>;
		increaseBalance(amount: number): Promise<void>;
		decreaseBalance(amount: number): Promise<void>;

		_patch(data: APIUserData): void;
	}

	interface MessageEmbed {
		splitFields(title: string, content: string | string[]): this;
		splitFields(content: string | string[]): this;
	}

}

declare module 'klasa' {

	interface KlasaClientOptions {
		dev?: boolean;
		nms?: {
			role?: number;
			everyone?: number;
		};
		lavalink?: BaseNodeOptions;
	}

	interface PieceDefaults {
		ipcMonitors?: PieceOptions;
		rawEvents?: PieceOptions;
	}

	interface Language {
		PERMISSIONS: Record<PermissionString, string>;
		HUMAN_LEVELS: Record<0 | 1 | 2 | 3 | 4, string>;
		duration(time: number, precision?: number): string;
		ordinal(cardinal: number): string;

		get<T extends LanguageKeysSimple>(term: T): LanguageKeys[T];
		get<T extends LanguageKeysComplex>(term: T, ...args: Parameters<LanguageKeys[T]>): ReturnType<LanguageKeys[T]>;
		tget<T extends LanguageKeysSimple>(term: T): LanguageKeys[T];
		tget<T extends LanguageKeysComplex>(term: T, ...args: Parameters<LanguageKeys[T]>): ReturnType<LanguageKeys[T]>;
		retrieve<T extends LanguageKeysSimple>(term: T): LanguageKeys[T];
		retrieve<T extends LanguageKeysComplex>(term: T, ...args: Parameters<LanguageKeys[T]>): ReturnType<LanguageKeys[T]>;
	}

	interface SettingsFolder {
		get<K extends string, S>(key: CustomGet<K, S>): S;
		increase(key: string, value: number, options?: SettingsFolderUpdateOptions): Promise<SettingsUpdateResults>;
		decrease(key: string, value: number, options?: SettingsFolderUpdateOptions): Promise<SettingsUpdateResults>;
	}

	interface Argument {
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore 1070
		abstract run<T>(arg: string | undefined, possible: Possible, message: KlasaMessage, filter?: (entry: T) => boolean): any;
	}

}

declare module 'klasa-dashboard-hooks' {

	interface AuthData {
		user_id: string;
	}

}

interface Fn {
	(...args: readonly any[]): unknown;
}

export type LanguageKeysSimple = {
	[K in keyof LanguageKeys]: LanguageKeys[K] extends Fn ? never : K;
}[keyof LanguageKeys];

export type LanguageKeysComplex = {
	[K in keyof LanguageKeys]: LanguageKeys[K] extends Fn ? K : never;
}[keyof LanguageKeys];
