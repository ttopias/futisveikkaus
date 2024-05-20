<script lang="ts">
  import { fade } from 'svelte/transition';
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import type { ActionData, PageData } from './$types';
  import Time from 'svelte-time';

  export let data: PageData;
  export let form: ActionData;

  let predictions = data?.predictions || [];
  let predictableMatches = data?.predictableMatches || [];
  let currentIndex = 0;
  let carouselLength = data?.predictableMatches.length;

  function navigate(direction: number) {
    currentIndex += direction;
    if (currentIndex >= carouselLength) {
      currentIndex = 0;
    } else if (currentIndex < 0) {
      currentIndex = carouselLength - 1;
    }
  }

  let view = 'create';

$: {
  if ($page.url.searchParams.has('create')) {
    view = 'create';
  }
  if ($page.url.searchParams.has('edit')) {
    view = 'edit';
  }
}

  let loading = false;
</script>

<div in:fade class="pt-4">
  {#if view == 'create'}
    <div class="mx-4 form-control w-52 float-right">
      <div class="btn btn-primary">
        <a href="?edit ">MUOKKAA ARVAUKSIA</a>
      </div>
    </div>

    <!-- CREATE PREDICTIONS -->
  {#if !predictableMatches || predictableMatches.length === 0}
    <div>Ei enää veikattavia otteluita.</div>
  {:else}
    <div class="card h-full relative carousel carousel-center m-4 p-4 glass rounded-box">
      {#each data?.predictableMatches as match, index}
        <form
          class={`card-content carousel-item ${index === currentIndex ? 'block' : 'hidden'}`}
          method="POST"
          action="?/create"
          use:enhance={() => {
            loading = true;
            return async ({ result, update }) => {
              update();
              console.log(result);
              loading = false;
            };
          }}
        >
          <div class="form-control">
            <div class="card-title text-accent-content text-2xl justify-center">
              <Time timestamp={match?.date} format="DD.MM.YYYY" />
              {' '}{match?.time}
            </div>
            <input type="hidden" name="match_id" value={match.match_id} />

            <div class="flex justify-between mt-4 px-4">
              <div class="text-center font-bold w-1/2">
                <div class="flag-container">
                  <img
                    class="flag rounded-btn"
                    src={`../flags/${match.home.country_code}.svg`}
                    alt="{match.home.name} flag"
                  />
                </div>
                <label class="block text-sm mt-2">
                  {match.home.name}
                  <input
                    class="input input-bordered w-full"
                    id="home_goals"
                    name="home_goals"
                    placeholder="Kotijoukkueen maalit"
                    type="number"
                    min="0"
                    value={form?.home_goals ?? 0}
                  />
                </label>
              </div>

              <div class="text-center font-bold w-1/2">
                <div class="flag-container">
                  <img
                    class="flag rounded-btn"
                    src={`../flags/${match.away.country_code}.svg`}
                    alt="{match.away.name} flag"
                  />
                </div>
                <label class="block text-sm mt-2">
                  {match.away.name}
                  <input
                    class="input input-bordered w-full"
                    id="away_goals"
                    name="away_goals"
                    placeholder="Vierasjoukkueen maalit"
                    type="number"
                    min="0"
                    value={form?.away_goals ?? 0}
                  />
                </label>
              </div>
            </div>

            <div class="text-center mt-4 px-4">
              <button class="btn btn-primary w-full" class:loading type="submit">TALLENNA</button>
            </div>
          </div>
          {#if form?.error}
            <div class="text-center mt-4 px-4">
              <div class="btn btn-error w-full">{form.error.message}</div>
            </div>
          {/if}
        </form>
      {/each}
      <div class="absolute flex justify-between transform -translate-y-4/5 left-5 right-5 top-4/5">
        <button class="btn btn-circle" on:click={() => navigate(-1)}>❮</button>
        <button class="btn btn-circle" on:click={() => navigate(1)}>❯</button>
      </div>
    </div>
  {/if}
  
          <!-- UPDATE PREDICTIONS -->
  {:else if view == 'edit'}
    <div class="mx-4 form-control w-52 float-right">
      <div class="float-end btn btn-primary">
        <a href="?create" data-sveltekit-reload>TAKAISIN</a>
      </div>
    </div>

    {#if !predictions || predictions.length === 0}
      <div>Et ole vielä luonut veikkauksia</div>
    {:else}
      <ul class="card glass h-full relative carousel carousel-center m-4 p-4 rounded-box">
        {#each predictions as prediction}
          <form
            class="card-content my-4"
            method="POST"
            action="?/update"
            use:enhance={() => {
              loading = true;
              return async ({ result, update }) => {
                update();
                console.log(result);
                loading = false;
              };
            }}
          >
            <div class="form-control">
              <input type="hidden" name="match_id" value={prediction.match.match_id} />

              <div class="card-title text-accent-content text-2xl justify-center">
                <Time timestamp={prediction.match?.date} format="DD.MM.YYYY" />
                {' '}{prediction.match?.time}
              </div>

              <div class="flex justify-between mt-4 px-4">
                <div class="text-center font-bold w-1/2">
                  <div class="flag-container">
                    <img
                      class="flag rounded-btn"
                      src={`../flags/${prediction.match.home.country_code}.svg`}
                      alt="{prediction.match.home.name} flag"
                    />
                  </div>
                  <label class="block text-sm mt-2">
                    {prediction.match.home.name}
                    <input
                      class="input input-bordered w-full"
                      id="home_goals"
                      name="home_goals"
                      placeholder="Kotijoukkueen maalit"
                      type="number"
                      min="0"
                      value={form?.home_goals ?? 0}
                    />
                  </label>
                </div>

                <div class="text-center font-bold w-1/2">
                  <div class="flag-container">
                    <img
                      class="flag rounded-btn"
                      src={`../flags/${prediction.match.away.country_code}.svg`}
                      alt="{prediction.match.away.name} flag"
                    />
                  </div>
                  <label class="block text-sm mt-2">
                    {prediction.match.away.name}
                    <input
                      class="input input-bordered w-full"
                      id="away_goals"
                      name="away_goals"
                      placeholder="Vierasjoukkueen maalit"
                      type="number"
                      min="0"
                      value={form?.away_goals ?? 0}
                    />
                  </label>
                </div>
              </div>

              <div class="text-center mt-4 px-4 inline-flex gap-4 justify-between">
                <form
                  class="w-1/3"
                  method="POST"
                  action="?/delete"
                  use:enhance={() => {
                    loading = true;
                    return async ({ result, update }) => {
                      update();
                      console.log(result);
                      loading = false;
                      predictions = predictions.filter((p) => p.guess_id !== prediction.guess_id);
                    };
                  }}
                  >
                  <button class="w-full btn btn-error" type="submit">POISTA</button>
                  <input type="hidden" name="guess_id" value={prediction.guess_id} />
                </form>
                <button class="w-1/3 btn btn-primary" class:loading type="submit">TALLENNA</button>
              </div>
            </div>
            {#if form?.error}
              <div class="text-center mt-4 px-4">
                <div class="btn btn-error w-full">{form.error.message}</div>
              </div>
            {/if}
          </form>
        {/each}
      </ul>
    {/if}
  {/if}
</div>

<style>
  .flag-container {
    height: 4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .flag {
    height: 100%;
    width: auto;
    max-width: 100%;
  }
</style>
