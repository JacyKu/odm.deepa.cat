import { decodeBuildParam } from './buildUrlCodec.js';

const token = 'b1_AoJbU6NidL9UaiRPos8wPGdMOcmsrsKZsgAAAAA';
const result = decodeBuildParam(token, {});
console.log('decode with empty itemData:', result);
console.log('is null:', result === null);
