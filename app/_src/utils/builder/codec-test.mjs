import { encodeBuildParam, decodeBuildParam, decodeBuildName } from './buildUrlCodec.js';

const legacy =
    'm=Ensanguined%20Flower&o=None&h=None&c=None&l=None&b=None&charm=None&name=My%20Test%20Build&cl=Cleric&sk=Celestial:2,WeaponMastery:1';
const token = encodeBuildParam(legacy);
console.log('token head:', token.slice(0, 40));
console.log('decoded:', decodeBuildParam(token, {}));
console.log('name:', decodeBuildName(token));

const legacy1 = 'm=Ensanguined%20Flower&o=None&h=None&c=None&l=None&b=None&charm=None&name=Old';
const token1 = encodeBuildParam(legacy1);
console.log('v1 token head:', token1.slice(0, 40));
console.log('decoded1:', decodeBuildParam(token1, {}));
