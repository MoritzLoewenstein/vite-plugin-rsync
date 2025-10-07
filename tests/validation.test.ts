import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import type { ResolvedConfig } from "vite";
import vitePluginRsync, { type UserOptions } from "../src/index.ts";

describe("Configuration validation", () => {
	const createMockConfig = (): ResolvedConfig =>
		({
			root: "/test/project",
			logger: {
				error: mock.fn(),
				info: mock.fn(),
				warn: mock.fn(),
				warnOnce: mock.fn(),
				hasErrorLogged: mock.fn(() => false),
				hasWarned: false,
				clearScreen: mock.fn(),
			},
		}) as unknown as ResolvedConfig;

	it("should log error when target.user is missing", () => {
		const options: UserOptions = {
			target: {
				user: "",
				host: "example.com",
				path: "/var/www",
			},
		};

		const plugin = vitePluginRsync(options);
		const mockConfig = createMockConfig();

		plugin.configResolved(mockConfig);

		const errorFn = mockConfig.logger.error as unknown as ReturnType<
			typeof mock.fn
		>;
		assert.equal(errorFn.mock.calls.length, 1);
		const firstArg = errorFn.mock.calls[0]?.arguments[0] as string;
		assert.ok(firstArg.includes("options.target.user"));
	});

	it("should log error when target.host is missing", () => {
		const options: UserOptions = {
			target: {
				user: "testuser",
				host: "",
				path: "/var/www",
			},
		};

		const plugin = vitePluginRsync(options);
		const mockConfig = createMockConfig();

		plugin.configResolved(mockConfig);

		const errorFn = mockConfig.logger.error as unknown as ReturnType<
			typeof mock.fn
		>;
		assert.equal(errorFn.mock.calls.length, 1);
		const firstArg = errorFn.mock.calls[0]?.arguments[0] as string;
		assert.ok(firstArg.includes("options.target.host"));
	});

	it("should log error when target.path is missing", () => {
		const options: UserOptions = {
			target: {
				user: "testuser",
				host: "example.com",
				path: "",
			},
		};

		const plugin = vitePluginRsync(options);
		const mockConfig = createMockConfig();

		plugin.configResolved(mockConfig);

		const errorFn = mockConfig.logger.error as unknown as ReturnType<
			typeof mock.fn
		>;
		assert.equal(errorFn.mock.calls.length, 1);
		const firstArg = errorFn.mock.calls[0]?.arguments[0] as string;
		assert.ok(firstArg.includes("options.target.path"));
	});

	it("should not log errors when all required fields are provided", () => {
		const options: UserOptions = {
			target: {
				user: "testuser",
				host: "example.com",
				path: "/var/www",
			},
		};

		const plugin = vitePluginRsync(options);
		const mockConfig = createMockConfig();

		plugin.configResolved(mockConfig);

		const errorFn = mockConfig.logger.error as unknown as ReturnType<
			typeof mock.fn
		>;
		assert.equal(errorFn.mock.calls.length, 0);
	});
});
