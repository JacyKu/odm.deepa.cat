// Resolves the app's URL prefix. The ODM app is served on its own host
// (odm.deepa.cat) at the route root, so links are always root-relative.
// (The /odm path on the main domain is redirected to odm.deepa.cat by the
// platform proxy.)

export function odmBaseForHost(hostname) {
    return '';
}

export function getOdmBase() {
    return '';
}
