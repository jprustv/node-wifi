var execFile = require('child_process').execFile;
var env = require('./env');

function deleteConnection(config, ap, callback) {
  var args = [];
  args.push('connection');
  args.push('delete');
  args.push('id');

  args.push(ap.ssid);

  execFile('nmcli', args, env, function(err) {
    callback && callback(err);
  });

  if (ap.fallbackConnection) {
    args = []
    args.push('con');
    args.push('modify');
    args.push(ap.fallbackConnection);
    args.push('connection.autoconnect');
    args.push('true');
    execFile('nmcli', args, env, function(err) {
      args = []
      args.push('con');
      args.push('up');
      args.push(ap.fallbackConnection);
      execFile('nmcli', args, env, function(err) {
        // ERROR
      });
    });


  }
}

module.exports = function(config) {
  return function(ap, callback) {
    if (callback) {
      deleteConnection(config, ap, callback);
    } else {
      return new Promise(function(resolve, reject) {
        deleteConnection(config, ap, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
  };
};
