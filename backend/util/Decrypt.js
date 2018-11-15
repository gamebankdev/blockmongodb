
// A23456789十JQK
// 黑红梅方
const bs58 = require('bs58');
const privateKeyModInverse = require('secp256k1').privateKeyModInverse
const publicKeyTweakMul = require('secp256k1').publicKeyTweakMul

const BaseCardMap = BaseCard.map(card => Buffer.from(card));

router.get("/test", async ctx => {
  var query = {};
  query["col2"] = "1540805079050";
  var result = await mongodb.find_page("threecard013", query, {_id:1}, 0, 50);
  var shuffer_cards = null;
  var game_result = null;
  result.forEach(element => {
    console.log("key:", element.key);
    if(element.key == "shuffer_cards")
      shuffer_cards = element.col3; // 每张牌对应一个base58字符串
    else if(element.key == "game_result")
      game_result = element.col3;
  });
  var encrypt_cards_bs58 = JSON.parse(shuffer_cards);
  console.log("encrypt_cards_bs58 len=", encrypt_cards_bs58.length);
  // 把每张牌的base58字符串还原成buffer
  var encrypt_cards_bytes = [];
  encrypt_cards_bs58.forEach(bs58_str => {
      //const bytes = Buffer.from(bs58.decode(bs58_str));
      encrypt_cards_bytes.push(Buffer.from(bs58.decode(bs58_str)));
  });
  console.log("encrypt_cards_bytes len=", encrypt_cards_bytes.length);

  var all_cards_prikeys = [];
  game_result = JSON.parse(game_result);
  game_result.forEach(op_data => {
    if(op_data.type == "result" ){
      all_cards_prikeys = JSON.parse(op_data.args).cards;
      //console.log("find result");
      //console.log(all_cards_prikeys);
    }
  })

  all_cards_prikeys.forEach(user_cards_prikeys => {
    //console.log("whoseCard:",user_cards_prikeys.name);
    var card_ids = [];
    user_cards_prikeys.cards.forEach(card_prikeys => {
      //console.log("card_index:",card_prikeys.index);
      var privateKeys = [];
      card_prikeys.keys.forEach(key_data => {
        //console.log("key_owner:",key_data.name,"key:",key_data.key);
        //key_data.bytes = bs58.decode(key_data.key);
        privateKeys.push(Buffer.from(bs58.decode(key_data.key)));
        //console.log("cardId:",(cardId+1));
      });
      var decrypted = privateKeys.reduce( 
        (prevCard, currCard) => publicKeyTweakMul(prevCard, privateKeyModInverse(currCard), true), 
        encrypt_cards_bytes[card_prikeys.index]);
      console.log("decrypted:",decrypted);
      var cardId = BaseCardMap.findIndex(cardKey => cardKey.equals(decrypted));
      card_ids.push(cardId);
    });
    console.log("whoseCard:",user_cards_prikeys.name,"cards:",card_ids);
  });
  /**
  cards:
  [
    {
      name:whoseCard,
      cards:
      [
        {
          index:card_index,
          keys:
          [
            {
              name:key_owner,
              key:prikey
            }
          ]
        },
        ...other two cards...
      ]
    },
    ...other users...
  ]
  */

  ctx.body = {
    code: 200,
    data: "OK",
    success: true
  };
  ctx.status = 200;
});
