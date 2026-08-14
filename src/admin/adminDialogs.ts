export type AdminConfirmRequest = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

export type AdminConfirmEventDetail = AdminConfirmRequest & {
  resolve: (confirmed: boolean) => void;
};

export const ADMIN_CONFIRM_EVENT = 'mybabyshire:admin-confirm';

export const requestAdminConfirm = (request: AdminConfirmRequest) => {
  if (typeof window === 'undefined') return Promise.resolve(false);

  return new Promise<boolean>((resolve) => {
    window.dispatchEvent(new CustomEvent<AdminConfirmEventDetail>(ADMIN_CONFIRM_EVENT, {
      detail: { ...request, resolve },
    }));
  });
};
