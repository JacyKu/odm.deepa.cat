# Spare the Sympathy

## Public Beta
This refactor is in public beta, bugs will occur and stats might be miscalculated.

It should not yet be used as a replacement for Ode to Misery.

Please report issues or feature requests on [Github](https://github.com/JacyKu/sts.deepa.cat/issues).

---

## Discord login + build saving

Required env vars on the server (never commit them):

- `STS_SESSION_SECRET` — at least 32 chars; encrypts the `sts-session` cookie
- `STS_DISCORD_CLIENT_ID` — Discord application client id
- `STS_DISCORD_CLIENT_SECRET`
- `STS_DB_PATH` — optional; defaults to `<cwd>/data/sts-builds.db`

The Discord application's redirect URI must be registered as:
`https://sts.deepa.cat/api/auth/discord/callback` (production) and
`http://localhost:3001/api/auth/discord/callback` (local dev).

---

### Planned updates:

- Build notes.
    > Implemented together with the share/save system.

- Discord Application.
    > Quickly access a build you created or share items you like. Implentation after a Build share/save system.
---

This project was refactored and rewritten from [Alecaboo](https://github.com/Alecaboo) their [Ode to Misery](https://github.com/Alecaboo/ohthemisery), which was originally made by [Albin](https://github.com/albarv340) and [FlamingoBike](https://github.com/FlamingoBike) their project [Oh the Misery](https://github.com/albarv340/ohthemisery).

A lot of thanks to them for building and maintaining this tool for Monumenta in the first place, and to [Deepacat](https://github.com/Deepacat) for new feature implementations, help and being awesome.