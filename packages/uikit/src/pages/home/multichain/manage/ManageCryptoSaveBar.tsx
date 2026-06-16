import { FC } from 'react';

export const ManageCryptoSaveBar: FC<{
    onSave: () => void;
    isSaving: boolean;
}> = ({ onSave, isSaving }) => (
    <div className="absolute inset-x-0 bottom-0 z-10 bg-backgroundTransparent backdrop-blur">
        <div className="flex w-full items-center px-4 py-4">
            <button
                type="button"
                onClick={onSave}
                disabled={isSaving}
                className="flex h-14 w-full items-center justify-center rounded-2xl bg-buttonPrimaryBackground text-label1 text-buttonPrimaryForeground disabled:opacity-60"
            >
                {isSaving ? 'Saving…' : 'Save Changes'}
            </button>
        </div>
        <div className="h-[21px]" />
    </div>
);
