<template>
    <div>
      <button @click="openModal">How To Play</button>
      <div v-if="showModal" class="modal" :class="{ 'fade-in': showModal, 'fade-out': !showModal }">
        <div class="modal-content">
          <span class="close-modal" @click="closeModal">&times;</span>
          <h1>This is a Caesar Cipher.</h1>
        <p> Also known as a Shift Cipher.
        In this puzzle, each letter has been replaced by another, and the entire alphabet has been
        shifted by a certain number of positions. </p> <p> For example, if the alphabet is shifted 3 places
        to the right, A becomes D, B becomes E, and so on. The key to solving this puzzle is
        figuring out how many spaces the alphabet has been shifted.</p> <p> The relationship between letters
        is consistent throughout the puzzle. For instance, if X equals O, that pattern will apply to
        every instance of X in the puzzle.</p> You can make your guess for each box by typing directly
        under the existing letter. If you get stuck, click “Unlock Hint”
        for more help. Good Luck.
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        showModal: false,
      };
    },
    methods: {
      openModal() {
        this.showModal = true;
      },
      closeModal() {
        this.showModal = false;
        setTimeout(() => {
            this.showModal = false;
        }, 300);
      },
    },
  };
  </script>
  
  <style scoped>
  .modal {
    position: fixed;
    z-index: 1000;
    left: 50%;
    top: 50%; 
    transform: translate(-50%, -50%); 
    width: 80%;
    max-width: 600px; 
    height: auto; 
    background-color: rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    animation-duration: 0.3s;
    animation-fill-mode: forwards;
  }
  
  .modal.fade-in {
    animation-name: fade-in;
  }
  
  .modal.fade-out {
    animation-name: fade-out;
  }
  
  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes fade-out {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
  
  .modal-content {
    background-color: white;
    padding: 25px;
    border-radius: 5px;
    position: relative;
    width: 100%;
  }

  h1, p {
    background-color: white;
  }
  
  .close-modal {
    position: absolute;
    top: 0px;
    right: 7px;
    font-size: 40px;
    cursor: pointer;
    background-color: white;
  }
  
  button {
    position: relative;
    top: 100%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 7px 15px;
    font-size: 16px;
    cursor: pointer;
    margin-top: 6rem;
    background-color: #121213;
    border-radius: 5%;
    border: 1px solid white;
    color: wheat;
  }
  
  button:hover {
    background-color: rgb(82, 81, 79);
  }
  </style>