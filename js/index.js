import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://ztfdmvegomhnujwvjmft.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0ZmRtdmVnb21obnVqd3ZqbWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyOTM1ODYsImV4cCI6MjA3Nzg2OTU4Nn0.btKAOSkwFZAR3y8I6fuK4MtwExeTollGeQYs8Jcek8U'
const supabase = createClient(supabaseUrl, supabaseKey)

//set to game start
const { data: insert, error: insert_error } = await supabase
.from('game_status')
.insert([{ status_id: 'GAME_START'}]);

// start game
document.querySelector(".start-button").addEventListener("click", async function() {
    document.querySelector(".start-button").style.display = 'none';
    document.querySelector(".loader").style.display = 'block';

      setTimeout(() => {
        window.location.href = "./admin_interface.html";
      }, 2000);
});
