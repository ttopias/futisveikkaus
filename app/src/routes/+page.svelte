<script lang="ts">
  import { PUBLIC_START_DATE } from '$env/static/public';
  import { rules } from '$lib/utils';
  import SvelteTable from 'svelte-table';
  import { onMount, onDestroy } from 'svelte';

  type Rule = {
    rule: string;
    points: string;
  };

  let countDownDate = new Date(PUBLIC_START_DATE).getTime();

  let days: number, hours: number, minutes: number, seconds: number, timeLeft: number;

  $: days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  $: hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  $: minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  $: seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  let interval: any;

  onMount(() => {
    interval = setInterval(() => {
      const now = new Date().getTime();
      timeLeft = countDownDate - now;

      if (timeLeft < 0) {
        clearInterval(interval);
        timeLeft = 0;
      }
    }, 1000);
  });

  onDestroy(() => {
    clearInterval(interval);
  });

  const columns = [
    {
      key: 'rule',
      title: 'Sääntö',
      value: (r: Rule) => r.rule,
      sortable: false,
    },
    {
      key: 'points',
      title: 'Pisteitä',
      value: (r: Rule) => r.points,
      sortable: true,
    },
  ];
</script>

<div class="m-4 p-4 items-center text-center pt-8">
  <div class="mb-8 p-4">
    <div class="text-4xl font-bold">KISOJEN ALKUUN</div>
    <div class="justify-center grid grid-flow-col gap-5 text-center auto-cols-max pt-4">
      <div class="flex flex-col">
        <span class="countdown font-mono text-5xl">
          <span style={`--value:${days};`}></span>
        </span>
        päivää
      </div>
      <div class="flex flex-col">
        <span class="countdown font-mono text-5xl">
          <span style={`--value:${hours};`}></span>
        </span>
        tuntia
      </div>
      <div class="flex flex-col">
        <span class="countdown font-mono text-5xl">
          <span style={`--value:${minutes};`}></span>
        </span>
        minuuttia
      </div>
      <div class="flex flex-col">
        <span class="countdown font-mono text-5xl">
          <span style={`--value:${seconds};`}></span>
        </span>
        sekuntia
      </div>
    </div>
  </div>

  <div class="card glass max-w-xl m-4 p-4 rounded-btn">
    <SvelteTable
      {columns}
      rows={rules}
      classNameTable={'table text-left'}
      classNameThead={'text-accent-content text-lg'}
      classNameTbody={'text-accent-content text-md'}
    />
  </div>
</div>
