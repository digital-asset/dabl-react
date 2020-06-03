
import { decode } from "jsonwebtoken";

function fieldFromDablJWT(token:string, fieldName:string):string|null{
  let decoded = decode(token);
  if(!decoded || typeof(decoded) === "string"){
    console.log(`JWT not in projectDABL format: ${token}`);
    return null;
  } else {
    return decoded[fieldName];
  }
}

export function partyName(token : string):string|null{
  return fieldFromDablJWT(token, "partyName");
}

export function expiredToken(token:string):boolean{
  const expInUnixEpoch = fieldFromDablJWT(token, "exp");
  if(expInUnixEpoch === null){
    return true;
  } else {
    let asSeconds = parseInt(expInUnixEpoch, 10);
    if(asSeconds === undefined){
      return true;
    } else{
      return asSeconds <= (new Date()).getTime();
    }
  }
}