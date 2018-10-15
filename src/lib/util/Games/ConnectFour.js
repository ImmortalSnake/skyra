/// <reference path="../../../index.d.ts" />
const LongLivingReactionCollector = require('../LongLivingReactionCollector');
const { CONNECT_FOUR: { REACTIONS, RESPONSES, EMOJIS } } = require('../constants');
const { Permissions: { FLAGS: { MANAGE_MESSAGES } } } = require('discord.js');
const { resolveEmoji } = require('../util');

module.exports = class ConnectFour {

	/**
	 * @typedef {Object[]} ConnectFourWinningRow
	 * @property {number} x
	 * @property {number} y
	 */

	constructor(challenger, challengee) {
		/**
		 * The Client that manages this instance
		 * @since 3.0.0
		 * @type {SKYRA.Skyra}
		 */
		this.client = challenger.client;

		/**
		 * The challenger of the game
		 * @since 3.0.0
		 * @type {SKYRA.SkyraUser}
		 */
		this.challenger = challenger;

		/**
		 * The challengee of the game
		 * @since 3.0.0
		 * @type {SKYRA.SkyraUser}
		 */
		this.challengee = challengee;

		/**
		 * The Message used for the game
		 * @since 3.0.0
		 * @type {?SKYRA.SkyraMessage}
		 */
		this.message = null;

		/**
		 * The Language used for the game's internacionalization
		 * @since 3.0.0
		 * @type {?SKYRA.Language}
		 */
		this.language = null;

		/**
		 * The current turn
		 * @since 3.0.0
		 * @type {number}
		 */
		this.turn = Math.round(Math.random());

		/**
		 * The table game
		 * @since 3.0.0
		 * @type {number[][]}
		 */
		this.table = [
			[0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0]
		];

		/**
		 * The winner of the game
		 * @since 3.0.0
		 * @type {?SKYRA.SkyraUser}
		 */
		this.winner = null;

		/**
		 * The Callback that holds the collector
		 * @since 3.0.0
		 * @type {?Function}
		 */
		this.collector = null;
		this.llrc = null;

		/**
		 * Whether this instance is running or not
		 * @since 3.0.0
		 * @type {boolean}
		 */
		this.running = false;
	}

	/**
	 * Get the ConnectFourManager instance that manages this
	 * @since 3.0.0
	 * @type {SKYRA.ConnectFourManager}
	 * @readonly
	 */
	get manager() {
		return this.client.connectFour;
	}

	/**
	 * Whether Skyra has the MANAGE_MESSAGES permission or not
	 * @since 3.0.0
	 * @type {boolean}
	 * @readonly
	 */
	get manageMessages() {
		// @ts-ignore
		return this.message.channel.permissionsFor(this.message.guild.me).has(MANAGE_MESSAGES);
	}

	/**
	 * Run the ConnectFour game
	 * @since 3.0.0
	 * @param {SKYRA.SkyraMessage} message The Message that runs this game
	 */
	async run(message) {
		if (this.running) return;
		this.llrc = new LongLivingReactionCollector(this.client, this.send.bind(this), this.gameTimeout.bind(this));
		this.llrc.setTime(120000);
		this.running = true;

		// @ts-ignore
		this.language = message.language;
		// @ts-ignore
		this.message = await message.edit(this.language.get('SYSTEM_LOADING'));
		for (const reaction of REACTIONS) await this.message.react(reaction);
		await this.render();

		while (this.running) { // eslint-disable-line
			let row;
			try {
				if (this.isFullGame()) throw RESPONSES.FULL_GAME;
				row = await this.getRow();
				if (!row) this.switch();
				await this.render();
			} catch (error) {
				if (error === RESPONSES.FULL_LINE) {
					await this.render(error);
				} else if (error === RESPONSES.FULL_GAME) {
					await this.gameFullLine();
					break;
				} else if (error === RESPONSES.TIMEOUT) {
					await this.gameTimeout();
					break;
				} else if (error && error.code === 10008) {
					this.gameLostMessage();
					break;
				} else {
					if (this.message) this.client.emit('commandError', this.message, this.client.commands.get('c4'), [this.challengee], error);
					else this.client.emit('wtf', error);
					break;
				}
			}

			if (row) break;
		}
	}

	async gameFullLine() {
		await this.gameDraw();
	}

	async gameDraw() {
		await this.message.edit(this.language.get('COMMAND_C4_GAME_DRAW', this.renderTable()));
		if (this.manageMessages) await this.message.reactions.removeAll().catch(err => this.client.emit('apiError', err));
	}

	async gameTimeout() {
		await this.message.edit(this.language.get('COMMAND_GAMES_TIMEOUT'));
		this.llrc.end();
	}

	gameLostMessage() {
		this.manager.delete(this.message.channel.id);
		this.llrc.end();
	}

	/**
	 * Show the winner and clear reactions
	 * @since 3.0.0
	 * @param {ConnectFourWinningRow} row The winning row
	 */
	showWinner(row) {
		this.winner = this.turn === 0 ? this.challenger : this.challengee;
		const VALUE = this.turn === 0 ? 'WINNER_1' : 'WINNER_2';
		// @ts-ignore
		for (const { x, y } of row) this.table[x][y] = VALUE;
		if (this.manageMessages) this.message.reactions.removeAll().catch(error => this.client.emit('apiError', error));
		this.llrc.end();
	}

	/**
	 * Get a row from the current player
	 * @since 3.0.0
	 * @returns {Promise<?ConnectFourWinningRow>}
	 */
	async getRow() {
		const PLAYER = (this.turn === 0 ? this.challenger : this.challengee).id;
		const reaction = await new Promise((resolve, reject) => {
			this.llrc.setTime(120000);
			this.llrc.setEndListener(reject);
			this.collector = (react, userID) => {
				if (userID === PLAYER && REACTIONS.includes(react.emoji.name)) {
					if (this.manageMessages) this.removeEmoji(react.emoji, userID);
					resolve(react.emoji.name);
				}
			};
		});
		return this.pushLine(REACTIONS.indexOf(reaction));
	}

	/**
	 * Push a new disk to a column
	 * @since 3.0.0
	 * @param {number} row The row to push
	 * @returns {?ConnectFourWinningRow}
	 */
	pushLine(row) {
		if (this.isFullLine(row)) throw RESPONSES.FULL_LINE;

		const column = this.table[row];
		for (let y = 0; y < column.length; y++) {
			if (column[y] === 0) {
				column[y] = this.turn + 1;
				return this.check(row, y);
			}
		}
		return null;
	}

	/**
	 * Check whether the game has all the lines full
	 * @since 3.0.0
	 * @returns {boolean}
	 */
	isFullGame() {
		for (let x = 0; x < this.table.length; x++)
			if (!this.isFullLine(x)) return false;

		return true;
	}

	/**
	 * Check whether the line is full
	 * @since 3.0.0
	 * @param {number} row The row to check
	 * @returns {boolean}
	 */
	isFullLine(row) {
		return this.table[row][4] !== 0;
	}

	/**
	 * Check if there's a winning row.
	 * @since 3.0.0
	 * @param {number} posX The position X to check
	 * @param {number} posY The position Y to check
	 * @returns {ConnectFourWinningRow}
	 */
	check(posX, posY) {
		const row = this._check(posX, posY);
		if (row) this.showWinner(row);
		return row;
	}

	/**
	 * Render the current table and add a head
	 * @since 3.0.0
	 * @param {number} [error] The error number
	 * @returns {SKYRA.SkyraMessage}
	 */
	render(error) {
		// @ts-ignore
		return this.message.edit((error === RESPONSES.FULL_LINE ? this.language.get('COMMAND_C4_GAME_COLUMN_FULL') : '') +
			this.language.get(
				this.winner ? 'COMMAND_C4_GAME_WIN' : 'COMMAND_C4_GAME_NEXT',
				this.turn === 0 ? this.challenger.username : this.challengee.username,
				this.turn,
				this.renderTable()
			)
		);
	}

	/**
	 * Render the current table
	 * @since 3.0.0
	 * @returns {string}
	 */
	renderTable() {
		const MAX_LENGTH = this.table.length;

		let output = '';
		for (let y = 4; y >= 0; y--) {
			for (let x = 0; x < MAX_LENGTH; x++) output += `${EMOJIS[this.table[x][y]]}       `;
			output += '\n';
		}
		return output;
	}

	/**
	 * Switch the current turn
	 * @since 3.0.0
	 */
	switch() {
		this.turn = this.turn ? 0 : 1;
	}

	/**
	 * Send a reaction to the internal handler
	 * @since 3.0.0
	 * @param {SKYRA.ReactionData} reaction The emoji
	 */
	send(reaction) {
		if (this.collector) this.collector(reaction, reaction.userID);
	}

	/**
	 * Remove an emoji from a message
	 * @since 3.0.0
	 * @param {string} emoji The emoji to remove
	 * @param {string} userID The user ID that reacted to the message
	 */
	async removeEmoji(emoji, userID) {
		// @ts-ignore
		await this.client.api.channels[this.message.channel.id].messages[this.message.id]
			.reactions[resolveEmoji(emoji)][userID].delete()
			.catch(error => this.client.emit('apiError', error));
	}

	/**
	 * Free memory by nully-ing all properties
	 * @since 3.0.0
	 */
	dispose() {
		this.challenger = null;
		this.challengee = null;
		this.message = null;
		this.language = null;
		this.turn = null;
		this.table = null;
		this.winner = null;
		this.running = false;
	}

	/**
	 * Check if there's a winning row.
	 * @since 3.0.0
	 * @param {number} posX The position X to check
	 * @param {number} posY The position Y to check
	 * @returns {ConnectFourWinningRow}
	 * @private
	 */
	_check(posX, posY) {
		const PLAYER = this.turn + 1;
		const MIN_X = Math.max(0, posX - 3),
			MIN_Y = Math.max(0, posY - 3),
			MAX_X = Math.min(6, posX + 3),
			MAX_Y = Math.min(4, posY + 3);

		// @ts-ignore
		const verticals = this._checkVerticals(posX, MIN_Y, MAX_Y, PLAYER);
		if (verticals) return verticals;

		let diagUp = 0, diagDown = 0, horizontal = 0;
		for (let offset = MIN_X - posX; offset <= MAX_X - posX; offset++) {
			const x = posX + offset;
			const tableX = this.table[x];

			// Check horizontals
			if (tableX[posY] === PLAYER) {
				horizontal++;
				if (horizontal === 4) {
					return [
						{ x: x - 3, y: posY },
						{ x: x - 2, y: posY },
						{ x: x - 1, y: posY },
						{ x: x, y: posY }
					];
				}
			} else { horizontal = 0; }


			// Check diagonals up
			const upY = posY + offset;
			if (MIN_Y <= upY && upY <= MAX_Y) {
				if (tableX[upY] === PLAYER) {
					diagUp++;
					if (diagUp === 4) {
						return [
							{ x: x - 3, y: upY - 3 },
							{ x: x - 2, y: upY - 2 },
							{ x: x - 1, y: upY - 1 },
							{ x: x, y: upY }
						];
					}
				} else { diagUp = 0; }
			}

			// Check diagonals down
			const downY = posY - offset;
			if (MIN_Y <= downY && downY <= MAX_Y) {
				if (tableX[downY] === PLAYER) {
					diagDown++;
					if (diagDown === 4) {
						return [
							{ x: x - 3, y: downY + 3 },
							{ x: x - 2, y: downY + 2 },
							{ x: x - 1, y: downY + 1 },
							{ x: x, y: downY }
						];
					}
				} else { diagDown = 0; }
			}
		}

		return null;
	}

	/**
	 * Check if there's a winning vertical row
	 * @since 3.0.0
	 * @param {number} posX The current X position
	 * @param {number} MIN_Y The minimum Y position
	 * @param {number} MAX_Y The maximum Y position
	 * @param {(1 | 2)} PLAYER The current player
	 * @returns {ConnectFourWinningRow}
	 * @private
	 */
	_checkVerticals(posX, MIN_Y, MAX_Y, PLAYER) {
		let verticals = 0, y;
		for (y = MIN_Y; y < MAX_Y; y++) {
			const row = this.table[posX][y];
			if (row === PLAYER) {
				verticals++;
				if (verticals === 4) break;
			} else { verticals = 0; }
		}

		if (verticals === 4) {
			return [
				{ x: posX, y: y - 3 },
				{ x: posX, y: y - 2 },
				{ x: posX, y: y - 1 },
				{ x: posX, y: y }
			];
		}

		return null;
	}

};
