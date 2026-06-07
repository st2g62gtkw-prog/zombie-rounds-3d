(() => {
  window.ZR.multiplayer = window.ZR.multiplayer || {};

  let connected = false;

  function connect() {
    connected = false;
    return false;
  }

  function disconnect() {
    connected = false;
  }

  function isConnected() {
    return connected;
  }

  function send() {
    return false;
  }

  window.ZR.socketClient = {
    connect,
    disconnect,
    isConnected,
    send,
  };
  window.ZR.multiplayer.socketClient = window.ZR.socketClient;
})();
