
const nodeKaptivo = require('../../@lightblue/node-kaptivo/index.js');

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

const CLIENT_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJjbGllbnQiOnsibmFtZSI6IkthcHRpdm8gTWFuYWdlciBEZXYgbW9kZSIsInJlZGlyZWN0X3VyaSI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODA4Mi9pbmRleC5odG1sIiwic2NvcGUiOlsiY2FwdHVyZSIsImxvY2FsX2NhcHR1cmUiLCJwYWlyIiwiZGlzY292ZXIiLCJyZW1vdGVfY29uZmlnIiwidmlldyIsImxvY2FsX3ZpZXciLCJtb25pdG9yIiwiY29udHJvbHBhZCJdfSwiaWF0IjoxNTIwODUyMzE1LCJpc3MiOiJrYXBwXzEifQ.cGBpxUCLnIQVnRo3EN0TQH_MhcSIsPoRdSYMDzmFZZJMYSVWEH-4dSsit581n-wDLPKi4uIU-Mhx6ssKuXaDhkJNfGOBf3KeHHsaxvHdV6LFY1R_tbyaz98Qg1cQwr1zKq6wTiqklXxqxX5zPhW9vUNPVCXfUbCjyNGAlxEGba5qPx8uWdhkf4_4w8JVnPPzEq9NJYgLFHObx0SJcyZRSoaV1A3RxHd9_ce2GxhTrdCANceSjx0q4ilUqp4DHwlfSuE5bo6KYivxmMzwanTrIRZ8U2f3AHBdjkOnhG1yQytaBgEXX4py6hsltRoTlelMEAGqnuTu7g-ufG_5HPgfVA';

nodeKaptivo.setGlobalClientToken(CLIENT_TOKEN);
nodeKaptivo.setVerbose(true);


async function testTest()
{
  //! -----------------------------------------------------
  let kap = new nodeKaptivo.NodeKaptivo({kaptivoId: 'HQKZRP'});
  // let kap = new nodeKaptivo.NodeKaptivo({ip: '198.168.0.27', ssl: true});
  //
  let info = (await kap.apiGet({path: '/api/discovery/info'})).result;

  console.log('IP = ' + kap.getKaptivoIp());
  console.log('FriendlyName = ' + info.friendly_name);

  try {
    // let accessToken = await kap.authorize({'scope': 'remote_config', admin_name: 'admin', admin_password: 'a'});
    // let accessToken = await kap.authorize({'scope': 'view', user_name: 'test'});
    // let accessToken = await kap.authorize({scope: 'pair'});
    // console.log('accessToken = ' + accessToken);
  } catch (err) {
    console.log('CAUGHT AN ERROR');
    console.log(err);
  }

  //! -----------------------------------------------------
  await kap.destroy();
}


// initial state
const state = {
}

// getters
const getters = {
}

// actions
const actions = {
}

// mutations
const mutations = {
}

export default {
  state,
  getters,
  actions,
  mutations
}

