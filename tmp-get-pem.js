const crypto = require('crypto');

async function run() {
  try {
    //const r = await fetch('https://clerk.weats.pro/.well-known/jwks.json');
    const r = await fetch('https://clerk.weats.app/.well-known/jwks.json')
    const jwks = await r.json();
    const key = jwks.keys[0];
    
    // Create the public key object directly from the JWK
    const publicKey = crypto.createPublicKey({
      key: key,
      format: 'jwk'
    });
    
    // Export it as a PEM string
    const pem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
    console.log("---- CHAVE PEM GERADA COM SUCESSO ----\n");
    console.log(pem);
    console.log("\n--------------------------------------");
  } catch (err) {
    console.error("Erro a gerar PEM:", err);
  }
}

run();
