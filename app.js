const express = require('express')
const app = express()
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
app.use(express.json())
//     Function for API-1//
const convert_for_api1 = dbObj => {
  return {
    playerId: dbObj.player_id,
    playerName: dbObj.player_name,
  }
}
//      Function for get matches      //
const convertForGet_matches = dbObj => {
  return {
    matchId: dbObj.match_id,
    match: dbObj.match,
    year: dbObj.year,
  }
}
//initilize         //
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
let db = null
const initilizeServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running on https://localhost:3000/')
    })
  } catch (e) {
    console.log(`Db Error : ${e}`)
  }
}
//    API-1      //
app.get('/players/', async (request, response) => {
  const db_query_all_players = `
    SELECT * FROM player_details;
    `
  const all_player_array = await db.all(db_query_all_players)
  response.send(all_player_array.map(eachItem => convert_for_api1(eachItem)))
})
//    API-2      //
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const db_query_all_players = `
    SELECT * FROM player_details
    WhERE
    player_id=${playerId};
    `
  const all_player_array = await db.get(db_query_all_players)
  response.send(convert_for_api1(all_player_array))
})
//     API-3    //
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const bodyPlayerDetails = request.body
  const {playerName} = bodyPlayerDetails
  const updatePlayerName_Query = `
  UPDATE 
    player_details
  SET
    player_name='${playerName}'
  WHERE 
  player_id=${playerId};
  `
  await db.run(updatePlayerName_Query)
  response.send('Player Details Updated')
})

//        API-4        //
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatch_query = `
  SELECT * FROM match_details
  WHERE
  match_id=${matchId};
  `
  const response_get_match_using_id = await db.get(getMatch_query)
  response.send(convertForGet_matches(response_get_match_using_id))
})
//       API-5        //
app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const get_matches_on_playerId_qry = `
  SELECT 
    match_details.match_id as matchId,
    match_details.match,
    match_details.year
  FROM match_details inner join player_match_score ON match_details.match_id=player_match_score.match_id
  WHERE
    player_id=${playerId};
  `
  const response_matches_pl_id = await db.all(get_matches_on_playerId_qry)
  response.send(response_matches_pl_id)
})
//       API-6        //
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const get_playersOn_matchId = `
  SELECT
     player_details.player_id as playerId,
    player_details.player_name as playerName  
    FROM 
    player_details inner join player_match_score ON player_details.player_id=player_match_score.player_id
  WHERE
    player_match_score.match_id=${matchId};
  `
  const response_get_pl_mId = await db.all(get_playersOn_matchId)
  response.send(response_get_pl_mId)
})
//         API-7           //
app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const get_player_scr_query = `
  SELECT 
    player_details.player_id as playerId,
      player_details.player_name as playerName,
      SUM(player_match_score.score) as totalScore,
      SUM(player_match_score.fours) as totalFours,
      SUM(player_match_score.sixes) as totalSixes
    FROM player_details 
    INNER JOIN player_match_score ON player_details.player_id=player_match_score.player_id
    WHERE player_details.player_id=${playerId};
  `
  const player_fullHistory = await db.all(get_player_scr_query)
  response.send(player_fullHistory)
})
initilizeServer()
module.exports = app
