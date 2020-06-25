
import { decode } from "jsonwebtoken";

function fieldFromDablJWT(token:string, fieldName:string):string|null{
  let decoded = decode(token);
  if(!decoded || typeof(decoded) === "string"){
    console.warn(`JWT not in projectDABL format: ${token}`);
    return null;
  } else {
    return decoded[fieldName];
  }
}

/**
 * Extract the name of the party, as supplied when that Party authenticates themselves with DABL, from a JWT token.
 * @param token A JWT from DABL.
 */
export function partyName(token : string):string|null{
  return fieldFromDablJWT(token, "partyName");
}

/**
 * JWT's from DABL expire every 24 hours.
 * @param token A JWT from DABL.
 */
export function expiredToken(token:string):boolean{
  const expInUnixEpoch = fieldFromDablJWT(token, "exp");
  if(expInUnixEpoch === null){
    return true;
  } else {
    let asSeconds = parseInt(expInUnixEpoch, 10);
    if(asSeconds === undefined){
      return true;
    } else{
      return asSeconds <= (new Date()).getTime()/1000;
    }
  }
}
