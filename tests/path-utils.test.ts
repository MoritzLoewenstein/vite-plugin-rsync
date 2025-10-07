import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	getRsyncSourcePath,
	windowsPathToCygwinPath,
} from "../src/index.ts";

describe("windowsPathToCygwinPath", () => {
	it("should convert Windows path to Cygwin path", () => {
		const result = windowsPathToCygwinPath("C:\\Users\\test");
		assert.equal(result, "/cygdrive/c\\Users\\test");
	});

	it("should handle paths with spaces", () => {
		const result = windowsPathToCygwinPath("C:\\My Projects\\app");
		assert.equal(result, "/cygdrive/c\\My?Projects\\app");
	});

	it("should convert Windows drive letter to lowercase", () => {
		const result = windowsPathToCygwinPath("D:\\code\\project");
		assert.equal(result, "/cygdrive/d\\code\\project");
	});

	it("should handle complex Windows paths with spaces", () => {
		const result = windowsPathToCygwinPath("E:\\Program Files\\My App");
		assert.equal(result, "/cygdrive/e\\Program?Files\\My?App");
	});
});

describe("getRsyncSourcePath", () => {
	it("should ensure trailing slash in rsync source path", () => {
		const result = getRsyncSourcePath("/home/user/project");
		assert.equal(result, "/home/user/project/");
	});

	it("should not add extra trailing slash if already present", () => {
		const result = getRsyncSourcePath("/home/user/project/");
		assert.equal(result, "/home/user/project/");
	});
});
