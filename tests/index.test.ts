import assert from "node:assert/strict";
import { describe, it } from "node:test";
import vitePluginRsync, { type UserOptions } from "../src/index.ts";

describe("vitePluginRsync", () => {
	it("should export a function", () => {
		assert.equal(typeof vitePluginRsync, "function");
	});

	it("should return a Vite plugin object", () => {
		const options: UserOptions = {
			target: {
				user: "testuser",
				host: "example.com",
				path: "/var/www",
			},
		};
		const plugin = vitePluginRsync(options);

		assert.equal(typeof plugin, "object");
		assert.equal(plugin.name, "moritzloewenstein:vite-plugin-rsync");
		assert.equal(plugin.apply, "build");
		assert.equal(plugin.enforce, "post");
	});

	it("should apply default values for optional fields", () => {
		const options: UserOptions = {
			target: {
				user: "testuser",
				host: "example.com",
				path: "/var/www",
			},
		};

		const plugin = vitePluginRsync(options);

		assert.ok(plugin);
	});

	it("should accept custom include and exclude patterns", () => {
		const options: UserOptions = {
			include: "build/**/*",
			exclude: ["*.map", "*.test.*"],
			target: {
				user: "testuser",
				host: "example.com",
				path: "/var/www",
			},
		};

		const _plugin = vitePluginRsync(options);

		assert.equal(options.include, "build/**/*");
		assert.deepEqual(options.exclude, ["*.map", "*.test.*"]);
	});

	it("should accept silent option", () => {
		const options: UserOptions = {
			silent: true,
			target: {
				user: "testuser",
				host: "example.com",
				path: "/var/www",
			},
		};

		const plugin = vitePluginRsync(options);

		assert.ok(plugin);
	});
});
