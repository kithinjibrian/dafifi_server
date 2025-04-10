import * as fs from "fs";
import * as gmail from "@googleapis/gmail"

export function get_credentials() {
    const content = fs.readFileSync("credentials.json", "utf-8");
    return JSON.parse(content);
}


export function get_token_from_code(code, callback) {
    const credentials = get_credentials();
    const { client_id, client_secret, redirect_uris } = credentials.web;
    const oAuth2Client = new gmail.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    oAuth2Client.getToken(code, (err, token: any) => {
        if (err) {
            console.log('Error getting token', err);
            return;
        }

        oAuth2Client.setCredentials(token);
        gmail.gmail({ version: 'v1', auth: oAuth2Client })
            .users.getProfile({ userId: 'me' })
            .then((response) => {
                token.client_id = client_id;
                token.client_secret = client_secret;
                token.email = response.data.emailAddress;
                callback(token);
            })
            .catch((err) => {
                console.error('Error getting profile:', err);
            });
    });
}
