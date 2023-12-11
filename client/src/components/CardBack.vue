<template>
  <div class="card">
   
    <!-- <div class="number">{{ number }}</div>
    <div class="symbol">{{ symbol }}</div> -->
  </div>
</template>


<style scoped>

.card {
  width: 100px;
  height: 150px;
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}


.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, #ffffff, #ffffff); 
  z-index: -1;
}

.card::after {
  content: '';
  position: absolute;
  top: 10%;
  left: 10%;
  right: 10%;
  bottom: 10%;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 5px,
    #183b5a 5px,
    #183b5a 10px
  );
  z-index: -1;
}
</style>
