const St = imports.gi.St;
const Main = imports.ui.main;
const Glib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const MainLoop = imports.mainloop;
const Me = imports.misc.extensionUtils.getCurrentExtension();

let myPopup, timeout;
let headphoneIcon = new St.Icon({
  gicon: Gio.icon_new_for_string(Me.dir.get_path() + "/headphones.svg"),
  style_class: "system-status-icon",
});
let speakerIcon = new St.Icon({
  gicon: Gio.icon_new_for_string(Me.dir.get_path() + "/speaker.svg"),
  style_class: "system-status-icon",
});

const MyPopup = GObject.registerClass(
  class MyPopup extends PanelMenu.Button {
    _init() {
      super._init(0);
      this.icon = new St.Icon({
        gicon: Gio.icon_new_for_string(Me.dir.get_path() + "/speaker.svg"),
        style_class: "system-status-icon",
      });
      this.add_child(this.icon);

      let item = new PopupMenu.PopupMenuItem("Switch Bluetooth Devices");
      this.menu.addMenuItem(item);
      let device1 = "0C:AE:BD:B9:AF:81";
      let device2 = "00:1B:66:0E:42:76";
      item.connect("activate", () => {
        if (checkStatus(device1)) {
          deactivateDevice(device1);
          activateDevice(device2);
        } else {
          deactivateDevice(device2);
          activateDevice(device1);
        }
      });
      this.menu.connect("open-state-changed", updateIcon);
    }
  }
);

function updateIcon() {
  if (checkStatus("0C:AE:BD:B9:AF:81")) {
    myPopup.icon.set_gicon(
      Gio.icon_new_for_string(Me.dir.get_path() + "/speaker.svg")
    );
  } else if (checkStatus("00:1B:66:0E:42:76")) {
    myPopup.icon.set_gicon(
      Gio.icon_new_for_string(Me.dir.get_path() + "/headphones.svg")
    );
  }
}

function checkStatus(device) {
  let [res, out, err, status] = Glib.spawn_command_line_sync(
    "bluetoothctl info " + device
  );

  const regex = /Connected:\s+(\w+)/;
  const match = out.toString().match(regex);

  if (match) {
    const connectedVariable = match[1];
    if (connectedVariable == "no") {
      return false;
    }
    return true;
  }
}
//0C:AE:BD:B9:AF:81
function activateDevice(device) {
  log("bluetoothctl connect " + device);
  if (!checkStatus(device)) {
    let [res, out, err, status] = Glib.spawn_command_line_sync(
      "bluetoothctl connect " + device
    );
    updateIcon();
    log(out);
  }
}
function deactivateDevice(device) {
  log("bluetoothctl connect " + device);
  if (checkStatus(device)) {
    let [res, out, err, status] = Glib.spawn_command_line_sync(
      "bluetoothctl disconnect " + device
    );
    updateIcon();
    log(out);
  }
}

function init() {}

function enable() {
  myPopup = new MyPopup();
  Main.panel.addToStatusArea("myPopup", myPopup, 1);
  if (!checkStatus("00:1B:66:0E:42:76")) {
    activateDevice("0C:AE:BD:B9:AF:81");
  }
  updateIcon();
}

function disable() {
  myPopup.destroy();
}
