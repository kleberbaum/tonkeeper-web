import { atom } from './entries/atom';
import { IStorage } from './Storage';
import { AppKey } from './Keys';
import { KeychainSecurity } from './AppSdk';
import { sha256 } from '@ton/crypto';

interface KeychainSettingsState {
    passwordHash?: string;
    biometryEnabled?: boolean;
}

export const hashPassword = async (password: string) => {
    const buffer = await sha256(password);
    return buffer.toString('hex');
};

const PREFIXED_NAMESPACE = 'chain';

/** Internal: full secure-store key for a prefixed value. */
const composeKey = (prefix: string, key: string) => `${PREFIXED_NAMESPACE}::${prefix}::${key}`;

export abstract class BaseKeychainService {
    security = atom<undefined | KeychainSecurity>(undefined);

    constructor(protected storage: IStorage) {
        this.invalidateState();
    }

    private async invalidateState() {
        this.loadPublicState().then(res => this.security.next(res));
    }

    private async loadPublicState() {
        const state = await this.loadState();
        return {
            biometry: state?.biometryEnabled,
            password: !!state?.passwordHash
        };
    }

    protected async loadState() {
        const result = await this.storage.get<KeychainSettingsState>(AppKey.KEYCHAIN_SETTINGS);
        return result ?? {};
    }

    protected async updateState(state: KeychainSettingsState | null) {
        if (!state) {
            await this.storage.set(AppKey.KEYCHAIN_SETTINGS, {});
        } else {
            const current = await this.loadState();
            await this.storage.set(AppKey.KEYCHAIN_SETTINGS, { ...current, ...state });
        }
        await this.invalidateState();
    }

    securityCheck = async (type?: 'biometry' | 'password' | 'preferred') => {
        const state = await this.loadState();

        if (state.biometryEnabled || type === 'biometry') {
            try {
                await this.securityCheckTouchId();
                return;
            } catch (e) {
                console.error('Biometry authentication failed', e);
            }
        }

        return this.securityCheckPassword();
    };

    async checkPassword(password: string) {
        const state = await this.loadState();
        if (!state.passwordHash) {
            throw new Error('Password is not set');
        }

        const actualHash = await hashPassword(password);
        return actualHash === state.passwordHash;
    }

    async updatePassword(password: string) {
        const hash = await hashPassword(password);
        await this.updateState({ passwordHash: hash });
    }

    async setBiometry(enabled: boolean) {
        if (enabled) {
            await this.securityCheck('biometry');
        }
        await this.updateState({ biometryEnabled: enabled });
    }

    async resetSecuritySettings() {
        await this.updateState(null);
    }

    private async securityCheckPassword() {
        const state = await this.loadState();
        if (!state.passwordHash) {
            return;
        }

        return new Promise<void>((resolve, reject) => {
            this.promptPassword(async pin => {
                if (!pin) {
                    reject('Pin Cancelled');
                    return false;
                }

                const pinHash = await hashPassword(pin);
                if (pinHash === state.passwordHash) {
                    resolve();
                    return true;
                } else {
                    return false;
                }
            });
        });
    }

    protected abstract securityCheckTouchId(): Promise<void>;
    protected abstract promptPassword(
        callback: (pin?: string) => Promise<boolean | undefined>
    ): void;

    /**
     * Raw secure-store I/O used by the prefixed namespace below. Skips
     * the password/biometry prompt: prefixed values are not the mnemonic.
     * Subclasses must NOT call `securityCheck()` from these.
     */
    protected abstract setRawData(key: string, value: string): Promise<void>;
    protected abstract getRawData(key: string): Promise<string | null>;
    protected abstract deleteRawData(key: string): Promise<void>;

    setValue = async (prefix: string, key: string, value: string) => {
        const fullKey = composeKey(prefix, key);
        await this.setRawData(fullKey, value);
        await this.trackPrefixKey(prefix, fullKey);
    };

    getValue = async (prefix: string, key: string) => {
        return this.getRawData(composeKey(prefix, key));
    };

    deleteValue = async (prefix: string, key: string) => {
        const fullKey = composeKey(prefix, key);
        await this.deleteRawData(fullKey);
        await this.untrackPrefixKey(prefix, fullKey);
    };

    deletePrefix = async (prefix: string) => {
        const keys = await this.loadPrefixIndex();
        const tracked = keys[prefix] ?? [];
        await Promise.all(tracked.map(k => this.deleteRawData(k)));
        delete keys[prefix];
        await this.savePrefixIndex(keys);
    };

    private async loadPrefixIndex(): Promise<Record<string, string[]>> {
        const raw = await this.storage.get<Record<string, string[]>>(AppKey.KEYCHAIN_PREFIX_INDEX);
        return raw ?? {};
    }

    private async savePrefixIndex(index: Record<string, string[]>): Promise<void> {
        await this.storage.set(AppKey.KEYCHAIN_PREFIX_INDEX, index);
    }

    private async trackPrefixKey(prefix: string, fullKey: string): Promise<void> {
        const index = await this.loadPrefixIndex();
        const list = index[prefix] ?? [];
        if (!list.includes(fullKey)) {
            list.push(fullKey);
            index[prefix] = list;
            await this.savePrefixIndex(index);
        }
    }

    private async untrackPrefixKey(prefix: string, fullKey: string): Promise<void> {
        const index = await this.loadPrefixIndex();
        const list = index[prefix];
        if (!list) return;
        const next = list.filter(k => k !== fullKey);
        if (next.length === 0) {
            delete index[prefix];
        } else {
            index[prefix] = next;
        }
        await this.savePrefixIndex(index);
    }
}
