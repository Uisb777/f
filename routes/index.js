const express = require('express')
const req = require('express/lib/request')
const sql = require('mssql')
const router = express.Router()
const { request } = require('../database')

async function showSongs(req, res) {
  let songs = []

  if (!req.session || !req.session.userLogin) {
    res.redirect('/main')
    return;
  }
  if (req.session.userLogin === 'admin') {
    res.redirect('/admin')
    return;
  }
  try {
    const dbRequest = await request()
    let result;


    if (req.query.kategoria?.length > 0 && req.query.kraj?.length > 0) {
      result = await dbRequest
        .input('Kategoria', sql.VarChar(15), req.query.kategoria)
        .input('KrajPochodzenia', sql.VarChar(15), req.query.kraj)
        .query('SELECT * FROM Piosenka WHERE Kategoria = @Kategoria AND KrajPochodzenia = @KrajPochodzenia')
    } else if (req.query.kategoria?.length > 0) {
      result = await dbRequest
        .input('Kategoria', sql.VarChar(15), req.query.kategoria)
        .query('SELECT * FROM Piosenka WHERE Kategoria = @Kategoria')
    } else if (req.query.kraj?.length > 0) {
      result = await dbRequest
        .input('KrajPochodzenia', sql.VarChar(15), req.query.kraj)
        .query('SELECT * FROM Piosenka WHERE KrajPochodzenia = @KrajPochodzenia')
    } else if (req.query.Wykonawca?.length > 0) {
      result = await dbRequest
        .input('Wykonawca', sql.VarChar(300), req.query.Wykonawca)
        .query('SELECT * FROM Piosenka WHERE Wykonawca = @Wykonawca')
    }
     else {
      result = await dbRequest.query('SELECT * FROM Piosenka')
    }

    songs = result.recordset
  } catch (err) {
    console.error('Nie udało się pobrać piosenki', err)
  }

  res.render('index', { 
    title: 'Lista piosenek', 
    songs: songs, 
    message: res.message, 
    kategoria: req.query.kategoria,
    userLogin: req.session?.userLogin
  })
}

async function showNewProductForm(req, res) {
  res.render('new-song', { title: 'Nowa piosenka' })
}

async function addNewProduct(req, res, next) { 
  if (req.session.userUmowa === "TAK"){
    try {
      const dbRequest = await request()
      await dbRequest
        .input('Tytul', sql.VarChar(30), req.body.Tytul)
        .input('CzasTrwania', sql.Time, req.body.CzasTrwania)
        .input('Wykonawca', sql.VarChar(30), req.body.Wykonawca)
        .input('Kategoria', sql.VarChar(15), req.body.kategoria)
        .input('KrajPochodzenia', sql.VarChar(30), req.body.KrajPochodzenia)
        .input('DataDodania', sql.Date, parseInt(req.body.DataDodania))
        .input('LinkOkladki', sql.VarChar(300), req.body.LinkOkladki)
        .query(`INSERT INTO Piosenka VALUES (@Tytul ,@CzasTrwania, @Wykonawca, @Kategoria, @KrajPochodzenia, @DataDodania, @LinkOkladki)`)

      res.message = 'Dodano nową piosenke'
    } catch (err) {
      console.error('Nie udało się dodać piosenki', err)
    }
  
    showSongs(req, res)
  }else{
    showSongs(req, res)
  }
}


async function deleteProduct(req, res) {

  try {
    const dbRequest = await request()

    await dbRequest
      .input('Id', sql.INT, req.params.id)
      .query('DELETE FROM Piosenka WHERE Id = @Id')
  } catch (err) {
    console.error('Nie udało się usunąć piosenki', err)
  }

  res.message = `Usunięto piosenke o id ${req.params.id}`;

    res.redirect("/")
}

async function showLoginForm(req, res) {
  res.render('login', { title: 'Logowanie' })
}

async function login(req, res) {
  const {login, password} = req.body;

  try {
    const dbRequest = await request()

    const result = await dbRequest
      .input('Imie', sql.VarChar(25), login)
      .input('Haslo', sql.VarChar(25), password)
      .query('SELECT Imie FROM Uzytkownik WHERE Login = @Imie AND Haslo = @Haslo')
  
    if (result.rowsAffected[0] === 1) {
      req.session.userLogin = login;
      res.redirect('/')
    } else {
      res.render('login', {title: 'Logownie', error: 'Logowanie nieudane'})
    }
  } catch (err) {
    res.render('login', {title: 'Logownie', error: 'Logowanie nieudane'})
  }

}

function logout(req, res) {
  req.session.destroy();

  res.redirect('/main')
}

async function showPeople(req, res) {
  let users = []

  if (req.query.id?.length > 0){
    return showUser(req, res)
  }

  try {
    const dbRequest = await request()
    let result;
  
    result = await dbRequest
      .query('SELECT * FROM Uzytkownik')
  
    users = result.recordset
  } catch (err) {
    console.error('Nie udało się załadować użytkowników', err)
  }
  res.render('Uzytkownik', { 
    title: 'Lista użytkowników', 
    users: users, 
    message: res.message
  })
}

async function  showUser(req, res) {
  let user
  try {
    const dbRequest = await request()
    let result;
  
    result = await dbRequest
      .input('Id', sql.Int, req.query.id)
      .query('SELECT * FROM Uzytkownik WHERE Id = @Id')
  
    user = result.recordset[0]
  } catch (err) {
    console.error('Nie udało się załadować użytkowników', err)
  }
  res.render('uzytkownik-info', { 
    title: 'Informacje o użytkowniku', 
    user: user
  })

}

async function showPeopleForUser(req, res) {
  let users = []
  try {
    const dbRequest = await request()
    let result;
  
    result = await dbRequest
      .query('SELECT * FROM Uzytkownik')
  
    users = result.recordset
  } catch (err) {
    console.error('Nie udało się załadować użytkowników', err)
  }
  res.render('UzytkownikUser', { 
    title: 'Lista użytkowników', 
    users: users, 
    message: res.message
  })
}

async function showRegisterForm(req, res) {
  res.render('Register', { title: 'Rejestracja' })
}

async function register(req, res) {
  const {Id, imie, nazwisko, login, haslo, email, umowa} = req.body;

  try {
    let dbRequest = await request()

    const result = await dbRequest
      .input('Admin', sql.VarChar(3), 'NIE')
      .input('Imie', sql.VarChar(25), imie)
      .input('Nazwisko', sql.VarChar(25), nazwisko)
      .input('Login', sql.VarChar(25), login)
      .input('Haslo', sql.VarChar(25), haslo)
      .input('Email', sql.VarChar(25), email)
      .input('Umowa', sql.VarChar(25), umowa)
      .query('INSERT INTO Uzytkownik VALUES (@Admin, @Imie, @Nazwisko, @Login, @Haslo, @Umowa, @Email, DEFAULT, DEFAULT)')
    
    const resul = await dbRequest
      .input('Login', sql.VarChar(25), login)
      .query("INSERT INTO Playlista VALUES (@Login, 'Prywtna', DEFAULT, @Id)")
    
      

    if (result.rowsAffected[0] === 1) {
      req.session.userLogin = login;
      req.session.userUmowa = umowa;    
      
      let dbRequest = await request()

    //  await dbRequest
    //     .input('Login', sql.VarChar(25), login)
    //     .query(`INSERT INTO Playlista VALUES ('Ulubione','Prywtna','2022-04-04', (SELECT Id FROM Uzytkownik WHERE Login = @Login), (SELECT PlylistaId FROM PlaylistaPiosenka )) 
    //     INSERT INTO PlaylistaPiosenka
    //     VALUES
    //     ((SELECT Id FROM Playlista),(SELECT * FROM Piosenki WHERE )),
    //     `)
        

      showSongs(req, res);
    }
    if (resul.rowsAffected[0] === 1) {
      req.session.userLogin = login;
      req.session.userUmowa = umowa;    
      
      let dbRequest = await request()

      showSongs(req, res);
  }
  }
  catch (err) {
    console.error(err);
    res.render('Register', {title: 'Logownie', error: 'Nie udało się stworzyć użytkownika'})
  }
}

async function admin(req, res) {
  res.render('admin', { title: 'Admin' }) 
}

async function piosenkiAdmin(req, res) {
  let songs = []
  try {
    const dbRequest = await request()
    let result;  

    result = await dbRequest
      .query('SELECT * FROM Piosenka')
    songs = result.recordset
  } catch (err) {
    console.error('Nie udało się pobrać piosenki', err)
  }

  res.render('piosenki-admin', { 
    title: 'Lista piosenek | Admin', 
    songs: songs, 
    message: res.message, 
    userLogin: req.session?.userLogin
  })
}

async function main(req, res) {
  res.render('main', { title: 'Strona Główna' })
}

async function showRegisterFormAdmin(req, res) {
  res.render('Register-admin', { title: 'Rejestracja' })
}

async function registerAdmin(req, res) {
  const {imie, nazwisko, login, haslo, email, umowa} = req.body;

  try {
    const dbRequest = await request()

    const result = await dbRequest
      .input('Admin', sql.VarChar(3), 'NIE')
      .input('Imie', sql.VarChar(25), imie)
      .input('Nazwisko', sql.VarChar(25), nazwisko)
      .input('Login', sql.VarChar(25), login)
      .input('Haslo', sql.VarChar(25), haslo)
      .input('Email', sql.VarChar(25), email)
      .input('Umowa', sql.VarChar(25), umowa)
      .query('INSERT INTO Uzytkownik VALUES (@Admin, @Imie, @Nazwisko, @Login, @Haslo, @Umowa, @Email, DEFAULT, DEFAULT)'
    )
  
    if (result.rowsAffected[0] === 1) {
      req.session.userLogin = login;
      req.session.userUmowa = umowa;
      showSongs(req, res);
    } else {
      res.render('Register', {title: 'Stwórz konto', error: 'Założenie konta się nie powiedło'})
    }
  } catch (err) {
    console.error(err);
    res.render('Register', {title: 'Logownie', error: 'Założenie konta się nie powiedło'})
  }
}

async function deleteUser(req, res) {

  try {
    const dbRequest = await request()

    await dbRequest
      .input('Id', sql.INT, req.params.id)
      .query('DELETE FROM Uzytkownik WHERE Id = @Id')
  } catch (err) {
    console.error('Nie udało się usunąć użytkownika', err)
  }

  res.message = `Usunięto użytkownika o id ${req.params.id}`;

  res.redirect("/Uzytkownik")
}

async function ZmianaUmowyTAK(req, res) 
{try {const dbRequest = await request()
  await dbRequest.input('Id', sql.INT, req.params.id)
    .input('Umowa', sql.VarChar(3), 'TAK')
    .query('Update Uzytkownik set Umowa = @Umowa WHERE Id = @Id')
} catch (err) 
{console.error('Nie udało się zmienić umowy użytkownika', err)
}

res.message = `Zmieniono umowę użytkownika o id ${req.params.id}`;

res.redirect("/Uzytkownik")}

async function ZmianaUmowyNIE(req, res) 
{try {const dbRequest = await request()
  await dbRequest.input('Id', sql.INT, req.params.id)
    .input('Umowa', sql.VarChar(3), 'NIE')
    .query('Update Uzytkownik set Umowa = @Umowa WHERE Id = @Id')
  } catch (err) 
  {console.error('Nie udało się zmienić umowy użytkownika', err)
}
res.message = `Zmieniono umowę użytkownika o id ${req.params.id}`;

res.redirect("/Uzytkownik")}

async function ulubione(req, res) {
  res.render('ulubione', { title: 'ulubione' })
}
async function showUlubione(req, res) {
  let songs = []

  if (!req.session || !req.session.userLogin) {
    res.redirect('/main')
    return;
  }
  try {
    const dbRequest = await request()
    let result;

      {
      result = await dbRequest.query('SELECT * FROM PlaylistaPiosenka')
    }

    songs = result.recordset
  } catch (err) {
    console.error('Nie udało się pobrać piosenki', err)
  }

  res.render('ulubione', { 
    title: 'Lista ulubionych piosenek', 
    songs: songs, 
    message: res.message, 
    kategoria: req.query.kategoria,
    userLogin: req.session?.userLogin
  })
}

async function dodajUlubione(req, res) {
  const {idPiosenki} = req.body;
  console.log(idPiosenki);
  req.session.userLogin
  try {
    const dbRequest = await request()

    await dbRequest
      .input('Id', sql.INT, req.params.id)
      .query('Insert into PlaylistaPiosenka WHERE PiosenkaId = @Id')
  } catch (err) {
    console.error('Nie udało się dodać piosenki', err)
  }

  res.message = `Dodano  piosenke o id ${req.params.id}`;

    res.redirect("/")
}


router.get('/', showSongs);
router.get('/new-song', showNewProductForm);
router.post('/new-song', addNewProduct);
router.post('/song/:id/delete', deleteProduct);
router.get('/login', showLoginForm);
router.post('/login', login);
router.post('/logout', logout);
router.get('/Uzytkownik', showPeople);
router.get('/UzytkownikUser', showPeopleForUser);
router.get('/Register', showRegisterForm);
router.post('/Register', register);
router.get('/admin', admin);
router.get('/piosenki-admin', piosenkiAdmin);
router.get('/main', main);
router.get('/Register-admin', showRegisterFormAdmin);
router.post('/Register-admin', registerAdmin);
router.post('/users/:id/delete', deleteUser);
router.post('/users/:id/TAK', ZmianaUmowyTAK)
router.post('/users/:id/NIE', ZmianaUmowyNIE)
router.get('/ulubione', ulubione);
router.get('/song/:id/love', showUlubione);
router.post('/song/:id/love', dodajUlubione);

module.exports = router;