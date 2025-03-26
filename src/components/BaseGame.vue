<template>
  <div>
    <div v-if="showNotification" class="notification">
      {{ notificationMessage }}
    </div>
    <div class="grid-container">
      <div class="left-panel">
        <div class="info-box">
          <div class="title" :class="{ animatedTitle: titleAnimating }">
            {{ animatedTitleText }}
          </div>
          <div class="entry-and-puzzle">
            <div class="entry-number">{{ puzzle ? puzzle.entry : '' }}</div>
            <div class="puzzle-date">{{ currentDate }}</div>
          </div>
        </div>
      </div>

      <div class="right-panel">
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p class="loading-text">Loading puzzle...</p>
        </div>
        <div v-else-if="puzzle">
          <div class="letter-container">
            <div class="coded-phrase">
              <div v-for="(word, wordIndex) in codedPhraseWords" :key="wordIndex" class="word-group">
                <div v-for="(char, charIndex) in word" :key="charIndex" class="letter-group">
                  <div class="code-div">{{ char }}</div>
                  <input
                    v-if="char.match(/[A-Z]/)"
                    type="text"
                    maxlength="1"
                    :value="decodedPhrase[getCharIndex(wordIndex, charIndex)]"
                    @input="updateDecoded(getCharIndex(wordIndex, charIndex), $event.target.value.toUpperCase())"
                  />
                  <span v-else></span>
                </div>
              </div>
            </div>
            <div class="solved" v-if="solved">Solved! The answer is: {{ puzzle.phrase }}</div>
            <div class="gave-up" v-if="gaveUp">The answer is: {{ puzzle.phrase }}</div>
            <div class="hint-box">
              <div class="hint-btns">
                <template v-if="!hint1Shown">
                  <button class="hint-button" @click="showHint(0)">&#x1F50E;&#xFE0E; CLICK HERE TO VIEW HINT</button>
                </template>
                <template v-else>
                  <div class="hint-one" :class="{ show: hint1Shown }">&#128193; &nbsp;{{ puzzle ? puzzle.additional_hints[0] : '' }}</div>
                </template>
                <template v-if="!hint2Shown">
                  <button class="hint-button" @click="showHint(1)">&#x1F50E;&#xFE0E; CLICK HERE TO VIEW HINT</button>
                </template>
                <template v-else>
                  <div class="hint-two" :class="{ show: hint2Shown }">&#128193; &nbsp;{{ puzzle ? puzzle.additional_hints[1] : '' }}</div>
                </template>
                <template v-if="!hint3Shown">
                  <button class="hint-button" @click="showHint(2)">&#x1F50E;&#xFE0E; CLICK HERE TO VIEW HINT</button>
                </template>
                <template v-else>
                  <div class="hint-three" :class="{ show: hint3Shown }">&#128193; &nbsp;{{ puzzle ? puzzle.additional_hints[2] : '' }}</div>
                </template>
                <button class="give-up-btn" @click="giveUp" v-if="hint1Shown && hint2Shown && hint3Shown && !solved && !gaveUp">Give Up?</button>
              </div>
            </div>
            <button class="share-results" v-if="solved || gaveUp" @click="shareResults">Share Results</button>
          </div>
        </div>
        <div v-else-if="!loading && !puzzle">
          <p>No puzzle available for today.</p>
        </div>
      </div>
    </div>
  </div>
</template>
  
  <script>
  import { db } from '@/firebaseConfig';
  import { collection, query, where, getDocs } from 'firebase/firestore';
  import HowToPlayModal from './HowToPlayModal.vue';
  
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
        titleAnimating: true,
        animatedTitleText: '',
        originalTitle: 'SECRET AGENT',
      };
    },
    components: {
      HowToPlayModal,
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
      codedPhraseWords() {
            return this.puzzle ? this.puzzle.coded_phrase.split(' ').map(word => word.split('')) : [];
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
      this.animateTitle();
      this.logResetTime();
    },
    methods: {
      async fetchPuzzle() {
      this.loading = true;
      const today = new Date().toISOString().slice(0, 10);
      const puzzlesRef = collection(db, 'puzzles');
      const q = query(puzzlesRef, where('date', '==', today));

      const querySnapshot = await getDocs(q);

      await new Promise(resolve => setTimeout(resolve, 700)); 

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        this.puzzle = doc.data();
      } else {
        this.puzzle = null;
      }
      this.loading = false;
    },
        animateTitle() {
      const cipher = 'WIGVIX EKIRX';
      let index = 0;
      const interval = setInterval(() => {
        if (index < this.originalTitle.length) {
          this.animatedTitleText = this.originalTitle.substring(0, index) + cipher.substring(index);
          index++;
        } else {
          this.animatedTitleText = this.originalTitle;
          this.titleAnimating = false;
          clearInterval(interval);
        }
      }, 125);
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
      getCharIndex(wordIndex, charIndex) {
            let index = 0;
            for (let i = 0; i < wordIndex; i++) {
                index += this.codedPhraseWords[i].length + 1;
            }
            return index + charIndex;
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
* {
  font-family: "Poppins", sans-serif;
}
.grid-container {
  display: grid;
  grid-template-columns: 1fr; 
  gap: 2px;
  padding: 2px;
  max-width: 700px; 
  margin: 0 auto;
}

.animatedTitle {
  transition: all 2s ease-in;
}

.left-panel,
.right-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.title {
  font-size: 1.5rem;
  margin-bottom: 5px;
  color: #ccc;
  border-bottom: solid 1px rgb(131, 130, 130);
  text-align: center;
  letter-spacing: 3px;
}

.entry-number,
.puzzle-date {
  margin-bottom: 5px;
  color: #ccc;
}

.entry-and-puzzle {
  display: flex;
  justify-content: space-between;
}

.hint-btns {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hint-button {
  padding: 10px 15px;
  background-color: #121213;
  color: white;
  cursor: pointer;
  border: solid 1px grey;
}

.give-up-btn {
  background-color: rgb(168, 10, 10);
  padding: 10px 15px;
}

.hint-button:hover,
.give-up-btn:hover {
  /* background-color: #0056b3; */
  color: white;
  cursor: pointer;
  border: solid 1px rgb(146, 199, 199);
}

.hint-one,
.hint-two,
.hint-three {
  display: none;
  padding: 10px;
  background-color: #e0e0e0;
}

.hint-one.show,
.hint-two.show,
.hint-three.show {
  display: block;
}

.coded-phrase {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  color: #ccc;
  margin-top: 10rem;
  margin-bottom: 5rem;
}

.word-group {
    display: flex;
    gap: 5px;
}

.letter-group {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.code-div {
  font-size: 25px;
  margin-bottom: 5px;
}

input[type="text"] {
  width: 15px;
  text-align: center;
  padding: 10px;
  color:  rgb(250, 252, 252);
  border: 1px solid rgb(146, 199, 199);
  background-color: #757474;
  border-radius: 10%;
  font-size: 17px;
}

.solved,
.gave-up {
  margin-top: 10px;
  color: rgb(210, 214, 214);
  font-size: 20px;
  text-align: center;
  margin-bottom: 5rem;
}

.gave-up {
  color: rgb(190, 87, 87);
}

.share-results {
  margin: 10px auto; 
  padding: 10px 15px;
  background-color: #4e6f83;
  color: white;
  cursor: pointer;
  display: block; 
  border-radius: 5%;
  border: 1px solid white;
}

.share-results:hover {
  background-color: #54696d;
}

.notification {
  background-color: #4082a8;
  color: #0d1e2e;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 5px;
  text-align: center;
}

.loading-container {
  position: fixed; 
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #121213;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  border: 4px solid rgba(204, 204, 204, 0.3);
  border-top: 4px solid #ccc;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

.loading-text {
  color: white;
  font-size: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 700px) {
  .coded-phrase {
  margin-top: 4rem;
}

.code-div {
  font-size: 20px;
  margin-bottom: 5px;
}

input[type="text"] {
  width: 15px;
  text-align: center;
  padding: 6px;
  color:  rgb(250, 252, 252);
  border: 1px solid rgb(146, 199, 199);
  background-color: #757474;
  border-radius: 10%;
  font-size: 15px;
}


}
</style>