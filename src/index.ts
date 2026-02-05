import { WebSocketServer } from 'ws';
import { AuthAdapter } from './adapters/auth/adapter';
import { SpeedQuestionsAdapter } from './adapters/speed_question/adapter';
import { WebSocketPool } from './core/lib/helpers/web-socket-pool';

const PORT = 3000;

const wss = new WebSocketServer({ port: Number(PORT) });

const socketsPool = new WebSocketPool()

const room: Room = {
  is_started: false,
  events_queue: [],
  choosed_questions_ids: [],
  team_won_phase1: null,
  used_magic_card_questions_ids: [],
  team1: {
    name: "Team (A)",
    choosen_club: null,
    is_connected: false,
    score: 0,
    used_magic_card: false,
    answered_speed_question: false
  },
  team2: {
    name: "Team (B)",
    choosen_club: null,
    is_connected: false,
    score: 0,
    used_magic_card: false,
    answered_speed_question: false
  },
}

AuthAdapter(wss, socketsPool, room)
SpeedQuestionsAdapter(wss, socketsPool, room)


