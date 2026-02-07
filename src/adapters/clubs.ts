import { WebSocketServer } from "ws";
import { WebSocketPool } from "../core/lib/helpers/web-socket-pool";
import { getParams, getRemainingTeamName } from "../core/lib/utils";
import { apps } from "../core/lib/assets";

type StartChoosingMessage = {
  event: 'start_choosing_clubs',
  data: null
}

type ChooseClubMessage = {
  event: 'choose_club',
  data: {
    club_id: number
  }
}

export function ClubsAdapter(wss: WebSocketServer, wsPool: WebSocketPool, room: Room) {
  wss.addListener('connection', (ws, request) => {
    const isAdmin = (getParams(request.url!).role === 'admin')
    const teamName = getParams(request.url!).team_name as RoomTeamName;
    const appName = getParams(request.url!).app_name as AppName;

    ws.on('message', (data: string) => {
      const clubs = apps[appName].clubs
      const parsed: StartChoosingMessage | ChooseClubMessage = JSON.parse(data)

      if (parsed.event === 'start_choosing_clubs' && isAdmin) {
        const remainingTeamName = getRemainingTeamName(room.team_won_phase1!)
        wsPool.send({
          to: [room.team_won_phase1!],
          message: {
            event: 'view_clubs',
            data: {
              clubs,
              hold: false
            }
          }
        })
        wsPool.send({
          to: [remainingTeamName],
          message: {
            event: 'view_clubs',
            data: {
              clubs,
              hold: true
            }
          }
        })
      }

      if (parsed.event === 'choose_club' && !isAdmin) {
        const club = apps[appName].clubs.find(club => club.id === parsed.data.club_id) || null

        if (!club) {
          return ws.send(JSON.stringify({
            event: 'error',
            data: {
              message: 'Club not found'
            }
          }))
        }

        if (!room.first_choosen_club_id && (teamName === room.team_won_phase1)) {
          const remainingTeamName = getRemainingTeamName(room.team_won_phase1!)
          room.first_choosen_club_id = parsed.data.club_id
          room[teamName].choosen_club = club

          wsPool.send({
            to: [remainingTeamName],
            message: {
              event: 'unhold_choosing_club',
              data: {
                choosen_club_id: club.id
              }
            }
          })
        } else {
          room[teamName].choosen_club = club

          if (room.team1.choosen_club && room.team2.choosen_club) {
            wsPool.send({
              to: ['admin'],
              message: {
                event: 'view_all_choosen_clubs',
                data: {
                  team1_club: room.team1.choosen_club,
                  team2_club: room.team2.choosen_club
                }
              }
            })
          }
        }
      }
    });
  })
}