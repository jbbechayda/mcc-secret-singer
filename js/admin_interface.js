import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://ztfdmvegomhnujwvjmft.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0ZmRtdmVnb21obnVqd3ZqbWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyOTM1ODYsImV4cCI6MjA3Nzg2OTU4Nn0.btKAOSkwFZAR3y8I6fuK4MtwExeTollGeQYs8Jcek8U'
const supabase = createClient(supabaseUrl, supabaseKey)

const images = [
    "./images/singer_female_whole.png",
    "./images/singer_male_whole.png",
    "./images/singer_female_half.png",
    "./images/singer_male_half.png"
  ];

let index = 0;
const img = document.querySelector(".singer");
const img2 = document.querySelector('.singer2')
let current_singer;
let current_game_status;
let guessInterval;

let winner;

let guessArray = [];

const guessList = document.querySelector('.guess-list');
guessList.scrollTop = guessList.scrollHeight;

//get current singer
const {data: singers, error} = await supabase
.from('secret_singers')
.select('*')
.eq('is_done', 'N')
.order('singer_num', { ascending: true })
.limit(1);

if(singers.length > 0){
    current_singer = singers[0];
    document.querySelector(".guess-title").textContent = `Secret Singer # ${current_singer.singer_num}`;

    // set to IDLE
    const { data: insert, error: insert_error } = await supabase
    .from('game_status')
    .insert([{ status_id: 'IDLE', singer: current_singer.singer_num}]);
}

else {
  document.querySelector(".guess-title").textContent = `Game Over`;
  document.querySelector('.play-button-div').style.display = 'none';
  document.querySelector('.images').style.display = 'none';

  // set to GAME_OVER
  const { data: insert, error: insert_error } = await supabase
  .from('game_status')
  .insert([{ status_id: 'GAME_OVER'}]);
}
  

setInterval(() => {
  img.classList.add("fade-out");
  img2.classList.add("fade-out")
    setTimeout(() => {
      index = (index + 1) % images.length;
      img.src = images[index];
      img.classList.remove("fade-out");

      img2.src = images[index];
      img2.classList.remove("fade-out");
    }, 800);
}, 3000);

document.querySelector(".play-button").addEventListener("click", async function() {
    document.querySelector('.images').style.display = 'none';
    document.querySelector('.right-pane').style.display = 'flex';

    setTimeout(() => {
      document.querySelector('.container').classList.add('show-right');
    }, 50);

    document.querySelector('.play-button').style.display = 'none';
    document.querySelector('.singer').style.display = 'block';

    const { data: insert, error: insert_error } = await supabase
    .from('game_status')
    .insert([{ status_id: 'SINGING', singer: current_singer.singer_num}]);

    const {data: game_status, error} = await supabase
    .from('game_status')
    .select('*')
    .order('id', { ascending: false })
    .limit(1);

    current_game_status = game_status[0];

    console.log(current_game_status.id);

    //get real time guesses
    guessInterval = setInterval(fetchGuesses, 1000);
    fetchGuesses();
});

document.querySelector(".stop-button").addEventListener("click", async function() {
  clearInterval(guessInterval);
  document.querySelector('.stop-button').style.display = 'none';
  document.querySelector('.singer').style.display = 'none';
  const { data: insert, error: insert_error } = await supabase
    .from('game_status')
    .insert([{ status_id: 'WINNER', singer: current_singer.singer_num}]);

  // show the secret singer
  document.querySelector('.guess-title').textContent = `The Secret Singer # ${current_singer.singer_num} is...`;

  document.querySelector('.drum').style.display = 'block';

  await new Promise(r => setTimeout(r, 5000));

  document.querySelector('.singer-name').textContent = `${current_singer.name}!`;
  document.querySelector('.drum').style.display = 'none';
  
  await new Promise(r => setTimeout(r, 1000));

  // get the winner
  for (const entry of guessArray) {
    if (entry.guess_id == current_singer.id){
      winner = entry;
      break;
    }
  }

  //trace the winner
  let guessDivs = document.querySelectorAll('.guess');
  let winner_id = 1;
  if (winner){
    for (const guessDiv of guessDivs) {
      let checkDiv = document.getElementById(`check_${guessDiv.id}`);
      
      await new Promise(r => setTimeout(r, 500));
      
      if (guessDiv.id === `${winner.user_id}_${winner.guess_id}`) {
          checkDiv.textContent = '✔';
          checkDiv.style.color = 'white';
          guessDiv.style.backgroundColor = 'green'
          checkDiv.style.display = 'block';

        // record the winner
        winner_id = winner.user_id;
        break;
      } else {
          checkDiv.style.display = 'block';
      }
      guessDiv.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }
  else {
    for (const guessDiv of guessDivs) {
      let checkDiv = document.getElementById(`check_${guessDiv.id}`);
      
      await new Promise(r => setTimeout(r, 500));
      checkDiv.style.display = 'block';
      guessDiv.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }
    
  await supabase
    .from('secret_singers')
    .update({ is_done: 'Y' })
    .eq('id', current_singer.id);
    
  await supabase
    .from('winners')
    .update({ player_id: winner_id })
    .eq('singer_num', current_singer.singer_num)
    .eq('singer_id', current_singer.id);
    
  document.querySelector('.next-button').style.display = 'block';
});

document.querySelector(".next-button").addEventListener("click", function() {
  document.querySelector('.next-button').style.display = 'none';
  setTimeout(() => {
    location.reload(true);
  }, 2000);
});

function addGuess(id, guess) {
  if(document.getElementById(id)){
    return;
  }
  const div = document.createElement('div');
  div.className = 'guess';
  div.id = id;
  div.textContent = guess;

  const check = document.createElement('span');
  check.id = `check_${id}`;
  check.textContent = '✘';
  check.style.color = 'red';
  check.style.fontWeight = 'bold';
  check.style.float = 'right';
  check.style.display = 'none';

  div.appendChild(check);

  guessList.appendChild(div);

  requestAnimationFrame(() => div.classList.add('show'));

  // auto-scroll smoothly to bottom
  guessList.scrollTo({
    top: guessList.scrollHeight,
    behavior: 'smooth'
  });
}

async function fetchGuesses() {
  const { data: guesses, error } = await supabase
    .from('user_guesses')
    .select('*')
    .eq('game_status_id', current_game_status.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching guesses:', error);
    return;
  }

  for (const entry of guesses) {
    if (!guessArray.some(g => g.id === entry.id)) {
      let text = "";

      const { data: player, error: player_error } = await supabase
        .from('attendees')
        .select('*')
        .eq('id', entry.user_id)
        .single();

      const { data: entry_guess, error: guess_error } = await supabase
        .from('attendees')
        .select('*')
        .eq('id', entry.guess_id)
        .single();

      if (player && entry_guess) {
        text = `${player.name} : ${entry_guess.name}`;
        let div_id = `${entry.user_id}_${entry.guess_id}`;
        addGuess(div_id, text);
        guessArray.push(entry);
      }
    }
  }
}
