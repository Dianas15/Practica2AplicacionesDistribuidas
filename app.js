const express = require('express');
const axios = require('axios');
const querystring = require('querystring');

const app = express();
const port = 8888;

const clientId = '5cc23f4736ed49b5a263cd056819290f';
const clientSecret = '071474a1d5b248d7940e6fe533c756c4';
const redirectUri = 'http://localhost:8888/callback'; // Asegúrate de que coincida con la configuración de tu aplicación de Spotify

app.get('/', (req, res) => {
  // Redirige al usuario a la página de autorización de Spotify
  const scopes = 'user-read-private user-read-email playlist-read-private';
  res.redirect(`https://accounts.spotify.com/authorize?${
    querystring.stringify({
      response_type: 'code',
      client_id: clientId,
      scope: scopes,
      redirect_uri: redirectUri,
    })
  }`);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code || null;

  try {
    // Intercambia el código de autorización por un token de acceso
    const response = await axios.post('https://accounts.spotify.com/api/token', querystring.stringify({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
    }), {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const accessToken = response.data.access_token;

    // Obtiene las playlists del usuario
    const playlistsResponse = await axios.get('https://api.spotify.com/v1/me/playlists', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const playlists = playlistsResponse.data.items;

    //Mostrar en consola los datos recibidos
    //console.log(playlists);

    // Renderiza una página HTML con las playlists
    res.send(`
      <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Tus Playlists de Spotify</title>
          <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
          <link rel="stylesheet" href="styles.css">
        </head>
        <body>
          <h1 style="color:#D2B4DE;">Tus Playlists de Spotify</h1>
          <div style="color:#D0D3D4;">Da click en la imagen para poder escucharla en Spotify<div>
          <br><br>
          <center>
          <table style="width:80%;">
            <thead>
            <tr style="color:#D2B4DE;">
              <th>Portada</th>
              <th>Nombre</th>
              <th>Descripcion</th>
              <th>Dueño</th>
              <th>#Canciones</th>
            </tr>
            </thead>
            <tbody>
            ${playlists.map(playlist => `<tr><td><a href='${playlist.uri}'><img src="${playlist.images[0].url}" alt="${playlist.name}" style="width:52px;height:52px;"></a></td><td>${playlist.name}</td><td>${playlist.description}</td><td>${playlist.owner.display_name}</td><td>${playlist.tracks.total}</td></tr>`).join('')}
            </tbody>
          </table>
         </center> 
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error:', error);
    res.send('Hubo un error al obtener las playlists.');
  }
});

app.listen(port, () => {
  console.log(`Servidor en ejecución en http://localhost:${port}`);
});
