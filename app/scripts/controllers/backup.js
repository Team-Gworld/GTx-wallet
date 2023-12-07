export default class BackupController {
  /**
   *
   * @typedef {Object} BackupController
   */
  constructor(opts = {}) {
    const { addressBookController, preferencesController } = opts;
    this.addressBookController = addressBookController;
    this.preferencesController = preferencesController;
  }

  // PUBLIC METHODS
  /**
   * Save user preferences and address book, but not identities
   */
  saveData() {
    const data = {
      addressBook: { ...this.addressBookController.state },
      preferences: { ...this.preferencesController.store.getState() },
    };
    delete data.preferences.selectedAddress;
    delete data.preferences.lostIdentities;
    delete data.preferences.identities;

    const filename = `GTxWallet_${new Date()
      .toISOString()
      .replace(/:/gu, '-')}.json`;
    const file = new Blob([JSON.stringify(data)], { type: 'application/json' });
    if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(file, filename);
    } else {
      // Others
      const a = document.createElement('a');
      const url = URL.createObjectURL(file);
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
    }
  }

  loadData(json) {
    const loadedData = JSON.parse(json);
    if (loadedData.addressBook) {
      this.addressBookController.update(loadedData.addressBook, true);
    }
    if (loadedData.preferences) {
      const { selectedAddress, lostIdentities, identities } =
        this.preferencesController.store.getState();
      this.preferencesController.store.updateState({
        ...loadedData.preferences,
        selectedAddress,
        lostIdentities,
        identities,
      });
    }
  }
}
