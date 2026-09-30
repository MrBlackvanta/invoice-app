const openDialog = function (this: HTMLDialogElement) {
  this.setAttribute("open", "");
};

const closeDialog = function (this: HTMLDialogElement, returnValue?: string) {
  if (!this.hasAttribute("open")) return;

  this.removeAttribute("open");
  if (returnValue !== undefined) this.returnValue = returnValue;
  this.dispatchEvent(new Event("close"));
};

export const installDialog = () => {
  const dialog = HTMLDialogElement.prototype;

  dialog.showModal ??= openDialog;
  dialog.show ??= openDialog;
  dialog.close ??= closeDialog;
};
