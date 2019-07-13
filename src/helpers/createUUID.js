// https://gist.github.com/eladkarako/642201a5ea67c451c7c0f133df15b924
/* eslint-disable */
function get_uuid(){ //Prefer Google Chrome's Crypto, but fallback to plain Math.random if it is not available.
  var random_string    = "undefined" === self.crypto ? (Math.random().toString(16) + Math.random().toString(16) + Math.random().toString(16) + Math.random().toString(16) + Math.random().toString(16)).replace(/0\./g,"") : Array.prototype.map.call(crypto.getRandomValues(new Uint32Array(20)), function(n){return n.toString(16)}).join("")
     ,random_y_bit     = "undefined" === self.crypto ? [8, 9, 'a', 'b'][~~(Math.random()*4)] : [8, 9, 'a', 'b'][crypto.getRandomValues(new Uint8Array(1))[0] % 4]
     ,template_uuid    = /.*(........)..(....)..(...)..(...)..(............).*/
     ,replace_pattern  = "$1-$2-4$3-" + random_y_bit + "$4-$5"
     ;
  return random_string.replace(template_uuid, replace_pattern);
}
/* eslint-enable */


/**
 * @returns {string}
 */
export default function createUUID() {
  return get_uuid();
}
