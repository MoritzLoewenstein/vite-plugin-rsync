import path from "node:path";
import Rsync from "rsync";
import type { Plugin, ResolvedConfig } from "vite";

export type Options = {
	/**
	 * glob(array) of files to include
	 * @default `dist/`
	 */
	include: string[] | string;
	/**
	 * glob(array) of files to exclude
	 * @default []
	 */
	exclude: string[] | string;
	/** rsync target server */
	target: {
		/**
		 * rsync target user
		 */
		user: string;
		/**
		 * rsync target host
		 */
		host: string;
		/**
		 * rsync target port
		 * @default 21
		 */
		port: number;
		/**
		 * rsync target path
		 */
		path: string;
	};
	/**
	 * disable logging
	 * @default false
	 */
	silent: boolean;
};

export default function vitePluginRsync(pluginOptions: Options): Plugin {
	let config: ResolvedConfig;
	pluginOptions.include ??= "dist/**/*";
	pluginOptions.exclude ??= [];
	let configValid = false;
	return {
		name: "moritzloewenstein:vite-plugin-rsync",
		apply: "build",
		enforce: "post",
		configResolved(_config: ResolvedConfig): void {
			config = _config;
			if (!pluginOptions.target.user) {
				config.logger.error(
					"vite-plugin-rsync: Failed to provide options.target.user",
				);
			}
			if (!pluginOptions.target.host) {
				config.logger.error(
					"vite-plugin-rsync: Failed to provide options.target.host",
				);
			}
			if (!pluginOptions.target.path) {
				config.logger.error(
					"vite-plugin-rsync: Failed to provide options.target.path",
				);
			}
			configValid = true;
		},
		closeBundle: {
			sequential: true,
			async handler(error?: Error): Promise<void> {
				if (error || !configValid) {
					return;
				}
				await deployRsync(pluginOptions, config);
			},
		},
	};
}

function deployRsync(
	pluginOptions: Options,
	viteConfig: ResolvedConfig,
): Promise<unknown> {
	const sourcePath = getRsyncSourcePath(viteConfig.root);
	const { promise, reject, resolve } = Promise.withResolvers();
	const rsyncCommand = Rsync.build({
		// trailing slash is important (contents of the directory will be copied, not directory itself)
		source: sourcePath,
		destination: `${pluginOptions.target.user}@${pluginOptions.target.host}:${pluginOptions.target.path}`,
		include: pluginOptions.include,
		exclude: pluginOptions.exclude,
		// 755 for directories, 644 for files, https://serverfault.com/a/233586
		chmod: "Du=rwx,Dgo=rx,Fu=rw,Fog=r",
		flags: [
			"recursive",
			"checksum", // only skip on checksum, not size & modification time
			"verbose", // more diagnostic output (which files where uploaded etc.)
			"compress",
			"delete", // delete files on remote which do not exist locally
		],
		shell: "ssh",
	});
	rsyncCommand.execute(
		(err, code, _cmd) => {
			if (err) {
				!pluginOptions.silent &&
					viteConfig.logger.error(`[rsync] ${code} ${err.message}`);
				reject(err);
				return;
			}

			if (code === 0) {
				!pluginOptions.silent && viteConfig.logger.info("[rsync] SUCCESS");
				resolve(undefined);
				return;
			}

			!pluginOptions.silent && viteConfig.logger.error(`[rsync] ${code}`);
			reject(new Error(`rsync exited with code ${code}`));
		},
		(data) => {
			!pluginOptions.silent &&
				printBufferToLines(viteConfig.logger.info, data, "[rsync]");
		},
		(data) => {
			!pluginOptions.silent &&
				printBufferToLines(viteConfig.logger.error, data, "[rsync] ERR:");
		},
	);
	return promise;
}

function getRsyncSourcePath(dirPath: string): string {
	if (process.platform === "win32" && dirPath[1] === ":") {
		dirPath = windowsPathToCygwinPath(dirPath);
	}

	if (!dirPath.endsWith("/")) {
		dirPath = `${dirPath}/`;
	}

	return dirPath;
}

function windowsPathToCygwinPath(dirPath: string): string {
	// get diskSign and rest of dirPath
	const diskSign = dirPath.charAt(0).toLowerCase();
	dirPath = dirPath.substring(2);

	// replace backslashes with forward slashes
	dirPath = dirPath.split(path.sep).join(path.posix.sep);

	// prepend 'cygdrive'
	dirPath = `/cygdrive/${diskSign}${dirPath}`;

	// replace spaces with questionmarks to escape them
	dirPath = dirPath.replace(/ /g, "?");

	return dirPath;
}

function printBufferToLines(
	logger: (msg: string) => void,
	buf: Buffer,
	linePrefix: string,
): void {
	const lines = buf.toString().trim().split("\n");
	for (const line of lines) {
		if (line) {
			logger(`${linePrefix} ${line}`);
		}
	}
}
