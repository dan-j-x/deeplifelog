import { type Plugin, type ResolvedConfig, type UserConfig } from 'vite';
export type AppConfig = Parameters<typeof multiple>[0][number];
export default function multiple(apps: {
    /**
     * Human friendly name of your entry point.
     */
    name: string;
    /**
     * Vite config file path.
     */
    config: string;
    /**
     * Explicitly specify the run command.
     */
    command?: 'build' | 'serve';
}[], options?: {
    /**
     * Called when all builds are complete.
     */
    callback?: () => void;
}): Plugin;
export declare function resolveConfig(config: ResolvedConfig, app: AppConfig): Promise<UserConfig>;
export declare function run(config: ResolvedConfig, apps: AppConfig[], mainAppCommand: ResolvedConfig['command']): Promise<void>;
