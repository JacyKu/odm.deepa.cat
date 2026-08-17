// Resolves the app's URL prefix. The STS app is served on its own host
// (sts.deepa.cat) at the route root, so links are always root-relative.
// (The /sts path on the main domain is redirected to sts.deepa.cat by the
// platform proxy.)

export function stsBaseForHost(hostname) {
    return '';
}

export function getStsBase() {
    return '';
}
