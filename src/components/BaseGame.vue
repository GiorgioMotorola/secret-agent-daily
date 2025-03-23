<template>
  <div>
    <div v-if="showNotification" class="notification">
      {{ notificationMessage }}
    </div>
    <div class="grid-container">
      <div class="left-panel">
        <div class="info-box">
          <div class="title">Secret Agent</div>
          <div class="entry-number">{{ puzzle ? puzzle.entry : '' }}</div>
          <div class="puzzle-date">{{ currentDate }}</div>
          <div class="address-one">17 W <span style="color: #3d3d3d;">10th St.</span> Alley</div>
          <div class="address-two">Unit B-13</div>
          <div class="address-three">Blackridge, <span style="color: #3d3d3d;">MI 48207</span></div>
        </div>

        <div class="hint-box">
          <div class="hint-btns">
            <template v-if="!hint1Shown">
              <button class="hint-button" @click="showHint(0)">&#x1F50E;&#xFE0E; CLICK HERE TO VIEW HINT I</button>
            </template>
            <template v-else>
              <div class="hint-one" :class="{ show: hint1Shown }">&#128448; &nbsp;{{ puzzle ? puzzle.additional_hints[0] : '' }}</div>
            </template>
            <template v-if="!hint2Shown">
              <button class="hint-button" @click="showHint(1)">&#x1F50E;&#xFE0E; CLICK HERE TO VIEW HINT II</button>
            </template>
            <template v-else>
              <div class="hint-two" :class="{ show: hint2Shown }">&#128448; &nbsp;{{ puzzle ? puzzle.additional_hints[1] : '' }}</div>
            </template>
            <template v-if="!hint3Shown">
              <button class="hint-button" @click="showHint(2)">&#x1F50E;&#xFE0E; CLICK HERE TO VIEW HINT III</button>
            </template>
            <template v-else>
              <div class="hint-three" :class="{ show: hint3Shown }">&#128448; &nbsp;{{ puzzle ? puzzle.additional_hints[2] : '' }}</div>
            </template>
            <button class="give-up-btn" @click="giveUp" v-if="hint1Shown && hint2Shown && hint3Shown && !solved && !gaveUp">Give Up?</button>
          </div>
        </div>
        <div class="image-box">
          <img :src="imageUrl" alt="Puzzle Image" />
        </div>
      </div>

      <div class="right-panel">
        <div v-if="loading">Loading puzzle...</div>
        <div v-else-if="puzzle">
          <div class="letter-container">
            <div class="hello">
              Hello Agent
              <input type="text" v-model="userName" placeholder="type your name here" />
            </div>
            <div class="instructions">
              Todays mission: decode this phrase. This is a Caesar Cipher, also known as a Shift Cipher.
              In this puzzle, each letter has been replaced by another, and the entire alphabet has been
              shifted by a certain number of positions. For example, if the alphabet is shifted 3 places
              to the right, A becomes D, B becomes E, and so on. The key to solving this puzzle is
              figuring out how many spaces the alphabet has been shifted. The relationship between letters
              is consistent throughout the puzzle. For instance, if X equals O, that pattern will apply to
              every instance of X in the puzzle. You can make your guess for each box by typing directly
              under the existing letter (see: the question marks). If you get stuck, click “Unlock Hint”
              for more help. Good Luck.
            </div>
            <div class="coded-phrase">
              <div v-for="(char, index) in puzzle.coded_phrase" :key="index" class="letter-group">
                <div class="code-div">{{ char }}</div>
                <input
                  v-if="char.match(/[A-Z]/)"
                  type="text"
                  maxlength="1"
                  placeholder="?"
                  :value="decodedPhrase[index]"
                  @input="updateDecoded(index, $event.target.value.toUpperCase())"
                />
                <span v-else></span>
              </div>
            </div>

            <div class="solved" v-if="solved">Solved! The answer is: {{ puzzle.phrase }}</div>
            <div class="gave-up" v-if="gaveUp">The answer is: {{ puzzle.phrase }}</div>
            <button class="share-results" v-if="solved || gaveUp" @click="shareResults">Share Results</button>
          </div>
        </div>
        <div v-else>
          <p>No puzzle available for today.</p>
        </div>
      </div>
    </div>
  </div>
</template>
  
  <script>
  import { db } from '@/firebaseConfig';
  import { collection, query, where, getDocs } from 'firebase/firestore';
  
  export default {
    data() {
      return {
        puzzle: null,
        loading: true,
        decodedPhrase: [],
        solved: false,
        gaveUp: false,
        hint1Shown: false,
        hint2Shown: false,
        hint3Shown: false,
        userName: '',
        notificationMessage: '',
        showNotification: false,
        imageUrl: './public/map.png',
      };
    },
    computed: {
      displayCodedPhrase() {
        return this.puzzle
          ? this.puzzle.coded_phrase
              .split('')
              .map((char, index) => {
                if (char.match(/[A-Z]/)) {
                  return this.decodedPhrase[index] || char;
                } else {
                  return char;
                }
              })
              .join('')
          : '';
      },
      currentDate() {
        const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${month}/${day}/${year}`;
    },
    },
    async mounted() {
      this.clearOldPuzzleData();
      await this.fetchPuzzle();
      this.initializeDecoded();
      if (this.puzzle) {
        const puzzleStatus = localStorage.getItem(`puzzle_${this.puzzle.date}`);
        if (puzzleStatus === 'solved') {
          this.solved = true;
        } else if (puzzleStatus === 'gaveUp') {
          this.gaveUp = true;
        }
      }
      this.logResetTime();
    },
    methods: {
        async fetchPuzzle() {
        this.loading = true;
        const today = new Date().toISOString().slice(0, 10);
        const puzzlesRef = collection(db, 'puzzles');
        const q = query(puzzlesRef, where('date', '==', today));

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            this.puzzle = doc.data();
        } else {
            this.puzzle = null;
        }
        this.loading = false;
        },
      initializeDecoded() {
        if (this.puzzle) {
          this.decodedPhrase = Array(this.puzzle.coded_phrase.length).fill('');
        }
      },
      updateDecoded(index, value) {
        if (!value.match(/[A-Z]/)) {
          return;
        }
        const originalChar = this.puzzle.coded_phrase[index];
        const newDecodedPhrase = [...this.decodedPhrase];
        newDecodedPhrase[index] = value;
        this.decodedPhrase = newDecodedPhrase;
  
        for (let i = 0; i < this.puzzle.coded_phrase.length; i++) {
          if (this.puzzle.coded_phrase[i] === originalChar && i !== index) {
            this.decodedPhrase[i] = value;
          }
        }
  
        this.checkSolution();
      },
      clearOldPuzzleData() {
        const today = new Date().toISOString().slice(0, 10);
        if (this.puzzle && this.puzzle.date !== today) {
          localStorage.removeItem(`puzzle_${this.puzzle.date}`);
        }
      },
      logResetTime() {
        const now = new Date();
        const resetTime = new Date(now);
        resetTime.setUTCHours(11, 0, 0, 0);
  
        if (now > resetTime) {
          resetTime.setDate(resetTime.getDate() + 1);
        }
  
        const timeUntilReset = resetTime.getTime() - now.getTime();
        const minutesUntilReset = Math.floor(timeUntilReset / (1000 * 60));
  
        console.log(`Puzzle resets in ${minutesUntilReset} minutes.`);
  
        this.resetTimer = setInterval(() => {
          const now2 = new Date();
          const timeUntilReset2 = resetTime.getTime() - now2.getTime();
          const minutesUntilReset2 = Math.floor(timeUntilReset2 / (1000 * 60));
          console.log(`Puzzle resets in ${minutesUntilReset2} minutes.`);
  
          if (minutesUntilReset2 <= 0) {
            clearInterval(this.resetTimer);
          }
        }, 60000);
      },
      checkSolution() {
        if (!this.puzzle) return;
        const currentDecoded = this.decodedPhrase.join('');
        const expected = this.puzzle.coded_phrase
          .split('')
          .map((char, index) => {
            if (char.match(/[A-Z]/)) {
              return this.decodedPhrase[index];
            } else {
              return char;
            }
          })
          .join('');
        this.solved = expected === this.puzzle.phrase;
        if (this.solved) {
          localStorage.setItem(`puzzle_${this.puzzle.date}`, 'solved');
        }
      },
      giveUp() {
        this.gaveUp = true;
        localStorage.setItem(`puzzle_${this.puzzle.date}`, 'gaveUp');
      },
      showHint(hintIndex) {
        if (hintIndex === 0) {
          this.hint1Shown = true;
        } else if (hintIndex === 1) {
          this.hint2Shown = true;
        } else if (hintIndex === 2) {
          this.hint3Shown = true;
        }
      },
      shareResults() {
      const results = `Secret Agent — ${this.puzzle.date}\n${
        this.solved ? 'Solved' : 'Gave Up'
      }\nStreak: 0 days\nHints used: ${
        this.hint1Shown + this.hint2Shown + this.hint3Shown
      }/3`;

      navigator.clipboard.writeText(results).then(() => {
        this.notificationMessage = 'Results copied to clipboard!';
        this.showNotification = true;
        setTimeout(() => {
          this.showNotification = false;
        }, 5000);
      });
    },
    },
    beforeUnmount() {
      clearInterval(this.resetTimer);
    },
  };
  </script>
<style>
:root {
  --main-bg-color: #ffffee;
}

* {
  font-family: "Special Elite", system-ui;
  font-weight: 500;
}

.grid-container {
  display: grid;
  grid-template-columns: 600px 1fr;
  gap: 20px;
  padding: 20px;
}

.left-panel {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.info-box {
  padding: 15px;
  margin-bottom: 0px;
  background-color: var(--main-bg-color); 
  box-shadow: #000000 0px 0px 0px 4px;
}

.hint-box {
  padding: 15px;
  height: 29vh;
  background-color: var(--main-bg-color);
  box-shadow: #000000 0px 0px 0px 4px;
}

/* .right-panel {

} */

.letter-container {
  box-shadow: #000000 0px 0px 0px 4px;
  padding: 2rem;
  background-color: var(--main-bg-color);
  height: 85vh;
  /* border: 1px solid #ccc; */
}

.notification {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--main-bg-color);
  border: 1px solid #b2ebf2;
  padding: 15px 20px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.title {
  font-size: 25px;
  text-align: start;
  color: #000000;
  background-color: var(--main-bg-color); 
}

.code-div {
  background-color: var(--main-bg-color); 
}

.entry-number,
.puzzle-date {
  color: #000000;
  background-color: var(--main-bg-color); 
}

.address-one {
  margin-top: .7rem;
}

.address-one, .address-two, .address-three {
  color: #000000;
  background-color: var(--main-bg-color); 
}

.coded-phrase {
  display: flex;
  justify-content: center;
  font-size: 30px;
  margin-top: 3rem;
  background-color: var(--main-bg-color); 
  color: #1d1c1c;
}

.hello {
  padding-bottom: 3rem;
  color: #1d1c1c;
  background-color: var(--main-bg-color); 
}

.hello input {
  border: none;
  width: 200px;
  font-size: 16px;
  text-align: start;
  margin-top: 3rem;
}

.hello input::placeholder {
  color: #928b8c;
}

.instructions {
  display: flex;
  justify-content: center;
  text-align: start;
  text-indent: 2rem;
  color: #1d1c1c;
  background-color: var(--main-bg-color); 
  margin-bottom: 10rem;
}

input {
  border: none;
  background-color: transparent;
  text-align: center;
  width: 15px;
  font-size: inherit;
  border-top: solid 1px #e4e2e2;
  background-color: var(--main-bg-color); 
}

input:focus {
  outline: none;
}

input::placeholder {
  color: rgb(206, 63, 44);
  font-weight: 300;
}

.letter-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 10px;
  margin-bottom: 5rem;
  margin-top: 1rem;
  font-family: 'Courier New', Courier, monospace !important;
  background-color: var(--main-bg-color); 
}

.hint-button {
  display: flex;
  justify-content: start;
  margin-top: 0.5rem;
  background-color: var(--main-bg-color); 
  border: none;
  font-size: 20px;
  /* font-family: 'Courier New', Courier, monospace !important; */
  cursor: pointer;
}

.hint-btns {
  display: flex;
  flex-direction: column;
  background-color: var(--main-bg-color); 
  font-size: 15px;
}

.give-up-btn {
  background-color: #b14848;
  margin-top: 15px;
  padding: 8px 16px;
  color: #fff;
  border: none;
  cursor: pointer;
  display: block;
  margin: 20px auto;
  width: fit-content;
}

.give-up-btn:hover {
  background: #e4b6b4;
}

.share-results:hover {
  background: #2ba2d1;
}

.gave-up {
  font-size: 20px;
  text-align: center;
  padding-top: 3rem;
}

.hint-one,
.hint-two,
.hint-three {
  text-align: start;
  padding: 0.5rem;
  margin-top: 1rem;
  opacity: 0;
  /* font-family: 'Courier New', Courier, monospace !important; */
}

.hint-one.show,
.hint-two.show,
.hint-three.show {
  animation: fadeIn 0.5s ease-in-out forwards;
  background-color: var(--main-bg-color); 
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.solved,
.gave-up {
  font-size: 20px;
  text-align: center;
  padding-top: 3rem;
  background-color: var(--main-bg-color);
}

.share-results {
  padding: 8px 16px;
  display: block;
  margin: 20px auto;
  width: fit-content;
  background-color: #4c74a8;
  cursor: pointer;
}

.image-box {
  align-self: flex-end;
  padding: 15px;
  box-sizing: border-box;
  background-color: var(--main-bg-color); 
  box-shadow: #000000 0px 0px 0px 4px;
}

.image-box img {
  display: block;
  max-width: 90%;
  height: auto;
  background-color: var(--main-bg-color); 
}

@media (max-width: 1500px) {
  .grid-container {
    grid-template-columns: 1fr;
  }

  .left-panel,
  .right-panel {
    grid-column: 1;
  }

  .left-panel {
    order: 1; 
  }

  .right-panel {
    order: 2; 
  }

  .image-box {
  display: none;
}

.image-box img {
  display: none;
}
}
</style>