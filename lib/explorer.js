var request = require('request')
  , settings = require('./settings')
  , Address = require('../models/address')
  , log4js = require('log4js');

var base_server = 'http://127.0.0.1:' + settings.port + "/";

var base_url = base_server + 'api/';

const Client = require('bitcoin-core');
const client = new Client(settings.wallet);

log4js.configure({
  appenders:{ 
    everything: { type: 'file', filename: 'logs/sync.log', maxLogSize: 10485760, backups: 10, compress: true }, 
    workerLog: { type: 'multiFile', base: 'logs/', property: 'categoryName',maxLogSize: 10485760, backups: 10, compress: true, extension: '.log' }, 
    console: { type: 'console' }  
    },

  categories:{
    default: { appenders: ['console','everything'], level: 'info'},
    OnlyShow: { appenders: ['console'], level: 'trace'},
    Workers: { appenders: ['console','workerLog'], level: 'debug'}            
    },
  disableClustering: true
});
const logger = log4js.getLogger();
const onlyConsole = log4js.getLogger('OnlyShow');     
const workerLog = log4js.getLogger('Workers.' + (process.env['type'] != null ? process.env['type'] +'-' : 'Web-') + process.pid);

// returns coinbase total sent as current coin supply
function coinbase_supply(cb) {
  Address.findOne({a_id: 'coinbase'}, function(err, address) {
    if (address) {
      return cb(address.sent);
    } else {
      return cb();
    }
  });
}

module.exports = {

  convert_to_satoshi: function(amount, cb) {
    // fix to 8dp & convert to string
    var fixed = amount.toFixed(8).toString(); 
    // remove decimal (.) and return integer 
    return cb(parseInt(fixed.replace('.', '')));
  },

  get_hashrate: function(cb) {
    if (settings.index.show_hashrate == false) return cb('-');
    if (settings.nethash == 'netmhashps') {
      if(settings.use_rpc){
        var uri = base_url + 'getmininginfo';
        request({uri: uri, json: true}, function (error, response, body) { //returned in mhash
          if (body.netmhashps) {
            if (settings.nethash_units == 'K') {
              return cb((body.netmhashps * 1000).toFixed(4));
            } else if (settings.nethash_units == 'G') {
              return cb((body.netmhashps / 1000).toFixed(4));
            } else if (settings.nethash_units == 'H') {
              return cb((body.netmhashps * 1000000).toFixed(4));
            } else if (settings.nethash_units == 'T') {
              return cb((body.netmhashps / 1000000).toFixed(4));
            } else if (settings.nethash_units == 'P') {
              return cb((body.netmhashps / 1000000000).toFixed(4));
            } else {
              return cb(body.netmhashps.toFixed(4));
            }
          } else {
            return cb('-');
          }
        });
      }else{
        client.command([{method:'getmininginfo', parameters: []}], function(err, response){
          if(err){console.log('Error: ', err); onlyConsole.trace(err)}
          else{
            return cb(response[0]);
          }
        });
      }
    } else {
      if(settings.use_rpc){
      var uri = base_url + 'getnetworkhashps';
      request({uri: uri, json: true}, function (error, response, body) {
        if (body == 'There was an error. Check your console.') {
          return cb('-');
        } else {
          if (settings.nethash_units == 'K') {
            return cb((body / 1000).toFixed(4));
          } else if (settings.nethash_units == 'M'){
            return cb((body / 1000000).toFixed(4));
          } else if (settings.nethash_units == 'G') {
            return cb((body / 1000000000).toFixed(4));
          } else if (settings.nethash_units == 'T') {
            return cb((body / 1000000000000).toFixed(4));
          } else if (settings.nethash_units == 'P') {
            return cb((body / 1000000000000000).toFixed(4));
          } else {
            return cb((body).toFixed(4));
          }
        }
      });
    }else{
      client.command([{method:'getnetworkhashps', parameters: []}], function(err, response){
        if(err){console.log('Error: ', err); onlyConsole.trace(err)}
        else{
          return cb(response[0]);
        }
      });
    }
    }
  },


  get_difficulty: function(cb) {
    if(settings.use_rpc){
    var uri = base_url + 'getdifficulty';
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body);
    });
  }else{
    client.command([{method:'getdifficulty', parameters: []}], function(err, response){
      if(err){console.log('Error: ', err); onlyConsole.trace(err)}
      else{
        return cb(response[0]);
      }
    });
  }
  },

  get_connectioncount: function(cb) {
    if(settings.use_rpc){
    var uri = base_url + 'getconnectioncount';
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body);
    });
  }else{
    client.command([{method:'getconnectioncount', parameters: []}], function(err, response){
      if(err){console.log('Error: ', err); onlyConsole.trace(err)}
      else{
        return cb(response[0]);
      }
    });
  }
  },

  get_masternodecount: function(cb) {
    if(settings.use_rpc){
    var uri = base_url + 'getmasternodecount';
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body);
    });
  }else{
    client.command([{method:'getmasternodecount', parameters: []}], function(err, response){
      if(err){console.log('Error: ', err); onlyConsole.trace(err)}
      else{
        return cb(response[0]);
      }
    });
  }
  },

  get_masternodes: function(cb) {
    if(settings.use_rpc){
    var uri = base_url + 'listmasternodes';
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body);
    });
  }else{
    client.command([{method:'listmasternodes', parameters: []}], function(err, response){
      if(err){console.log('Error: ', err); onlyConsole.trace(err)}
      else{
        return cb(response[0]);
      }
    });
  }
  },
  
  get_blockcount: function(cb) {
    if(settings.use_rpc){
      var uri = base_url + 'getblockcount';
      request({uri: uri, json: true}, function (error, response, body) {
        return cb(body);
      });
    }else{
      client.command([{method:'getblockcount', parameters: []}], function(err, response){
        if(err){console.log('Error: ', err); onlyConsole.trace(err)}
        else{
          if(response[0].name == 'RpcError'){
            return cb('There was an error. Check your console.');
          }
          return cb(response[0]);
        }
      });
    }
  },

  get_blockhash: function(height, cb) {
    if(settings.use_rpc){  
      var uri = base_url + 'getblockhash?height=' + height;
      request({uri: uri, json: true}, function (error, response, body) {
        return cb(body);
      });
    }else{
      client.command([{method:'getblockhash', parameters: [height]}], function(err, response){
        if(err){console.log('Error: ', err); onlyConsole.trace(err)}
        else{
          if(response[0].name == 'RpcError'){
            return cb('There was an error. Check your console.');
          }
          return cb(response[0]);
        }
      });
    }
  },

  get_block: function(hash, cb) {
    if(settings.use_rpc){
      var uri = base_url + 'getblock?hash=' + hash;
      request({uri: uri, json: true}, function (error, response, body) {
        return cb(body);
      });
    }else{
      client.command([{method:'getblock', parameters: [hash]}], function(err, response){
        if(err){console.log('Error: ', err); onlyConsole.trace(err)}
        else{
          if(response[0].name == 'RpcError'){
            return cb('There was an error. Check your console.');
          }
          return cb(response[0]);
        }
      });
    }  
  },

  get_rawtransaction: function(hash, cb) {
    if(settings.use_rpc){
      var uri = base_url + 'getrawtransaction?txid=' + hash + '&decrypt=1';
      request({uri: uri, json: true}, function (error, response, body) {
        return cb(body);
      });
    }else{
      client.command([{method:'getrawtransaction', parameters: [hash, 1]}], function(err, response){
        if(err){console.log('Error: ', err); onlyConsole.trace(err)}
        else{
          if(response[0].name == 'RpcError'){
            return cb('There was an error. Check your console.');
          }
          return cb(response[0]);
        }
      });
    } 
  },

  get_maxmoney: function(cb) {
    if(settings.use_rpc){
      var uri = base_url + 'getmaxmoney';
      request({uri: uri, json: true}, function (error, response, body) {
        return cb(body);
      });
    }else{
      client.command([{method:'getmaxmoney'}], function(err, response){
        if(err){console.log('Error: ', err); onlyConsole.trace(err)}
        else{
          return cb(response[0]);
        }
      });
    }
  },

  get_maxvote: function(cb) {
    if(settings.use_rpc){
      var uri = base_url + 'getmaxvote';
      request({uri: uri, json: true}, function (error, response, body) {
        return cb(body);
      });
    }else{
      client.command([{method:'getmaxvote'}], function(err, response){
        if(err){console.log('Error: ', err); onlyConsole.trace(err)}
        else{
          return cb(response[0]);
        }
      });  
    }
  },

  get_vote: function(cb) {
    if(settings.use_rpc){
      var uri = base_url + 'getvote';
      request({uri: uri, json: true}, function (error, response, body) {
        return cb(body);
      });
    }else{
      client.command([{method:'getvote'}], function(err, response){
        if(err){console.log('Error: ', err); onlyConsole.trace(err)}
        else{
          return cb(response[0]);
        }
      });    
    }
  },

  get_phase: function(cb) {
    if(settings.use_rpc){
      var uri = base_url + 'getphase';
      request({uri: uri, json: true}, function (error, response, body) {
        return cb(body);
      });
    }else{
      client.command([{method:'getphase'}], function(err, response){
        if(err){console.log('Error: ', err); onlyConsole.trace(err)}
        else{
          return cb(response[0]);
        }
      });   
    }
  },

  get_reward: function(cb) {
    if(settings.use_rpc){
      var uri = base_url + 'getreward';
      request({uri: uri, json: true}, function (error, response, body) {
        return cb(body);
      });
    }else{
      client.command([{method:'getreward'}], function(err, response){
        if(err){console.log('Error: ', err); onlyConsole.trace(err)}
        else{
          return cb(response[0]);
        }
      });    
    }
  },

  get_estnext: function(cb) {
    if(settings.use_rpc){
      var uri = base_url + 'getnextrewardestimate';
      request({uri: uri, json: true}, function (error, response, body) {
        return cb(body);
      });
    }else{
      client.command([{method:'getnextrewardestimate'}], function(err, response){
        if(err){console.log('Error: ', err); onlyConsole.trace(err)}
        else{
          return cb(response[0]);
        }
      });    
    }
  },

  get_nextin: function(cb) {
    if(settings.use_rpc){
      var uri = base_url + 'getnextrewardwhenstr';
      request({uri: uri, json: true}, function (error, response, body) {
        return cb(body);
      });
    }else{
      client.command([{method:'getnextrewardwhenstr'}], function(err, response){
        if(err){console.log('Error: ', err); onlyConsole.trace(err)}
        else{
          return cb(response[0]);
        }
      });    
    }
  },
  
  // synchonous loop used to interate through an array, 
  // avoid use unless absolutely neccessary
  syncLoop: function(iterations, process, exit){
    var index = 0,
        done = false,
        shouldExit = false;
    var loop = {
      next:function(){
          if(done){
              if(shouldExit && exit){
                  exit(); // Exit if we're done
              }
              return; // Stop the loop if we're done
          }
          // If we're not finished
          if(index < iterations){
              index++; // Increment our index
              if (index % 100 === 0) { //clear stack
                setTimeout(function() {
                  process(loop); // Run our process, pass in the loop
                }, 1);
              } else {
                 process(loop); // Run our process, pass in the loop
              }
          // Otherwise we're done
          } else {
              done = true; // Make sure we say we're done
              if(exit) exit(); // Call the callback on exit
          }
      },
      iteration:function(){
          return index - 1; // Return the loop number we're on
      },
      break:function(end){
          done = true; // End the loop
          shouldExit = end; // Passing end as true means we still call the exit callback
          exit();
          return;
      }
    };
    loop.next();
    return loop;
  },

  balance_supply: function(cb) {
    Address.find({}, 'balance').where('balance').gt(0).exec(function(err, docs) { 
      var count = 0;
      module.exports.syncLoop(docs.length, function (loop) {
        var i = loop.iteration();
        count = count + docs[i].balance;
        loop.next();
      }, function(){
        return cb(count);
      });
    });
  },

  get_supply: function(cb) {
    if(settings.use_rpc){
      if ( settings.supply == 'HEAVY' ) {
        var uri = base_url + 'getsupply';
        request({uri: uri, json: true}, function (error, response, body) {
          return cb(body);
        });
      } else if (settings.supply == 'GETINFO') {
        var uri = base_url + 'getinfo';
        request({uri: uri, json: true}, function (error, response, body) {
          return cb(body.moneysupply);
        });
      } else if (settings.supply == 'BALANCES') {
        module.exports.balance_supply(function(supply) {
          return cb(supply/100000000);
        });
      } else if (settings.supply == 'TXOUTSET') {
        var uri = base_url + 'gettxoutsetinfo';
        request({uri: uri, json: true}, function (error, response, body) {
          return cb(body.total_amount);
        });
      } else {
        coinbase_supply(function(supply) {
          return cb(supply/100000000);
        });
      }
    }else{
      if ( settings.supply == 'HEAVY' ) {
        client.command([{method:'getsupply'}], function(err, response){
          if(err){console.log('Error: ', err); onlyConsole.trace(err)}
          else{
            return cb(response[0]);
          }
        }); 
      } else if (settings.supply == 'GETINFO') {
        client.command([{method:'getinfo'}], function(err, response){
          if(err){console.log('Error: ', err); onlyConsole.trace(err)}
          else{
            return cb(response[0].blocks);
          }
        }); 
      } else if (settings.supply == 'BALANCES') {
        module.exports.balance_supply(function(supply) {
          return cb(supply/100000000);
        });
      } else if (settings.supply == 'TXOUTSET') {
        client.command([{method:'gettxoutsetinfo'}], function(err, response){
          if(err){console.log('Error: ', err); onlyConsole.trace(err)}
          else{
            return cb(response[0].total_amount);
          }
        }); 
      } else {
        coinbase_supply(function(supply) {
          return cb(supply/100000000);
        });
      }
    }
  },

  is_unique: function(array, object, cb) {
    var unique = true;
    var index = null;
    module.exports.syncLoop(array.length, function (loop) {
      var i = loop.iteration();
      if (array[i].addresses == object) {
        unique = false;
        index = i;
        loop.break(true);
        loop.next();
      } else {
        loop.next();
      }
    }, function(){
      return cb(unique, index);
    });
  },

  calculate_total: function(vout, cb) {
    var total = 0;
    module.exports.syncLoop(vout.length, function (loop) {
      var i = loop.iteration();
      //module.exports.convert_to_satoshi(parseFloat(vout[i].amount), function(amount_sat){
        total = total + vout[i].amount;
        loop.next();
      //});
    }, function(){
      return cb(total);
    });
  },

  prepare_vout: function(vout, txid, vin, cb) {
    var arr_vout = [];
    var arr_vin = [];
    arr_vin = vin;
    module.exports.syncLoop(vout.length, function (loop) {
      var i = loop.iteration();
      // make sure vout has an address
      if (vout[i].scriptPubKey.type != 'nonstandard' && vout[i].scriptPubKey.type != 'nulldata') { 
        // check if vout address is unique, if so add it array, if not add its amount to existing index
        //console.log('vout:' + i + ':' + txid);
        module.exports.is_unique(arr_vout, vout[i].scriptPubKey.addresses[0], function(unique, index) {
          if (unique == true) {
            // unique vout
            module.exports.convert_to_satoshi(parseFloat(vout[i].value), function(amount_sat){
              arr_vout.push({addresses: vout[i].scriptPubKey.addresses[0], amount: amount_sat});
              loop.next();
            });
          } else {
            // already exists
            module.exports.convert_to_satoshi(parseFloat(vout[i].value), function(amount_sat){
              arr_vout[index].amount = arr_vout[index].amount + amount_sat;
              loop.next();
            });
          }
        });
      } else {
        // no address, move to next vout
        loop.next();
      }
    }, function(){
      if (vout[0].scriptPubKey.type == 'nonstandard') {
        if ( arr_vin.length > 0 && arr_vout.length > 0 ) {
          if (arr_vin[0].addresses == arr_vout[0].addresses) {
            //PoS
            arr_vout[0].amount = arr_vout[0].amount - arr_vin[0].amount;
            arr_vin.shift();
            return cb(arr_vout, arr_vin);
          } else {
            return cb(arr_vout, arr_vin);
          }
        } else {
          return cb(arr_vout, arr_vin);
        }
      } else {
        return cb(arr_vout, arr_vin);
      }
    });
  },

  get_input_addresses_old: function(input, vout, cb) {
    var addresses = [];
    if (input.coinbase) {
      var amount = 0;
      module.exports.syncLoop(vout.length, function (loop) {
        var i = loop.iteration();
          amount = amount + parseFloat(vout[i].value);  
          loop.next();
      }, function(){
        addresses.push({hash: 'coinbase', amount: amount});
        return cb(addresses);
      });
    } else {
      module.exports.get_rawtransaction(input.txid, function(tx){
        if (tx) {
          module.exports.syncLoop(tx.vout.length, function (loop) {
            var i = loop.iteration();
            if (tx.vout[i].n == input.vout) {
              //module.exports.convert_to_satoshi(parseFloat(tx.vout[i].value), function(amount_sat){
              if (tx.vout[i].scriptPubKey.addresses) {
                addresses.push({hash: tx.vout[i].scriptPubKey.addresses[0], amount:tx.vout[i].value});  
              }
                loop.break(true);
                loop.next();
              //});
            } else {
              loop.next();
            } 
          }, function(){
            return cb(addresses);
          });
        } else {
          return cb();
        }
      });
    }
  },

  get_input_addresses: function(input, vout, rawtx, cb) {
    var addresses = [];
    if (input.coinbase) {
      var amount = 0;
      module.exports.syncLoop(vout.length, function (loop) {
        var i = loop.iteration();
          amount = amount + parseFloat(vout[i].value);  
          loop.next();
      }, function(){
        addresses.push({hash: 'coinbase', amount: amount});
        return cb(addresses);
      });
    } else {
          module.exports.syncLoop(rawtx.vout.length, function (loop) {
            var i = loop.iteration();
            if (rawtx.vout[i].n == input.vout) {
              //module.exports.convert_to_satoshi(parseFloat(tx.vout[i].value), function(amount_sat){
              if (rawtx.vout[i].scriptPubKey.addresses) {
                addresses.push({hash: rawtx.vout[i].scriptPubKey.addresses[0], amount:rawtx.vout[i].value});  
              }
              //console.log('breaking and next');
                loop.break(true);
                loop.next();
              //});
            } else {
              //console.log('next');
              loop.next();
            } 
          }, function(){
            //console.log('return');
            return cb(addresses);
          });
    }
  },

  prepare_vin_old: function(tx, cb) {
    var arr_vin = [];
    module.exports.syncLoop(tx.vin.length, function (loop) {
      var i = loop.iteration();
      module.exports.get_input_addresses(tx.vin[i], tx.vout, function(addresses){
        if (addresses && addresses.length) {
          //console.log('vin');
          module.exports.is_unique(arr_vin, addresses[0].hash, function(unique, index) {
            if (unique == true) {
              module.exports.convert_to_satoshi(parseFloat(addresses[0].amount), function(amount_sat){
                arr_vin.push({addresses:addresses[0].hash, amount:amount_sat});
                loop.next();
              });
            } else {
              module.exports.convert_to_satoshi(parseFloat(addresses[0].amount), function(amount_sat){
                arr_vin[index].amount = arr_vin[index].amount + amount_sat;
                loop.next();
              });
            }
          });
        } else {
          loop.next();
        }
      });
    }, function(){
      return cb(arr_vin);
    });
  },

  prepare_vin: function(tx, cb) {
    var arr_vin = [];
    var known_txids = [];
    for(i = 0; i < tx.vin.length; i++){
      if(known_txids.includes(tx.vin[i].txid)==false){
        known_txids.push(tx.vin[i].txid);
      }
    }

    module.exports.syncLoop(known_txids.length, function(rawloop){
      var i = rawloop.iteration();
      module.exports.get_rawtransaction(known_txids[i], function(raw){
        module.exports.get_input_addresses(tx.vin[i], tx.vout, raw, function(addresses){
          if (addresses && addresses.length) {
            //console.log('vin');
            module.exports.is_unique(arr_vin, addresses[0].hash, function(unique, index) {
              if (unique == true) {
                module.exports.convert_to_satoshi(parseFloat(addresses[0].amount), function(amount_sat){
                  arr_vin.push({addresses:addresses[0].hash, amount:amount_sat});
                  rawloop.next();
                });
              } else {
                module.exports.convert_to_satoshi(parseFloat(addresses[0].amount), function(amount_sat){
                  arr_vin[index].amount = arr_vin[index].amount + amount_sat;
                  rawloop.next();
                });
              }
            });
          } else {
            rawloop.next();
          }
        });
      })
    }, function(){
      return cb(arr_vin);
    });
  },

  get_masternodelist: function(cb) {
    if(settings.use_rpc){
    if (settings.baseType === 'pivx')
      var uri = base_url + 'masternode?command=list';
    else
      var uri = base_url + 'masternodelist?mode=full';
    request({uri: uri, json: true}, function (error, response, body) {
      return cb(body);
    });
  }else{
    if(settings.baseType === 'pivx'){
      client.command([{method:'masternode', parameters: ['list']}], function(err, response){
        if(err){console.log('Error: ', err); onlyConsole.trace(err)}
        else{
          return cb(response[0]);
        }
      });
    }else{
      client.command([{method:'masternodelist', parameters: ['full']}], function(err, response){
        if(err){console.log('Error: ', err); onlyConsole.trace(err)}
        else{
          return cb(response[0]);
        }
      });
    }
  }
  },

  format_unixtime: function(unixtime) {
    var a = new Date(unixtime*1000);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var suffix = 'th';
    if(date == 1 || date == 21 || date == 31)
      suffix = 'st';
    if (date == 2 || date == 22 || date == 32)
      suffix = 'nd';
    if (date == 3 || date == 23)
      suffix = 'rd';
    if (hour < 10)
      hour = '0' + hour;
    if (min < 10)
      min = '0' + min;
    if (sec < 10)
      sec = '0' + sec;
    var time = date + suffix + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
    return time
  }
};
