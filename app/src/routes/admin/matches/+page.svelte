<script lang="ts">
  import { enhance } from '$app/forms';
  import { Content, Modal, Trigger } from '$lib/index';
  import type { Match, Team } from '$lib/index';
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;
  let matches: Match[] = data?.matches ?? [];
  let teams: Team[] = data?.teams ?? [];

  let loading = false;
</script>

<Modal small>
  <Content class="card glass p-4 text-primary-content">
    <div class="card-title justify-center">Add Match</div>
    <form
      method="POST"
      action="?/create"
      use:enhance={() => {
        loading = true;
        return async ({ result, update }) => {
          update();
          loading = false;
        };
      }}
    >
      <div class="form-control">
        <label class="input input-bordered flex items-center gap-2">
          Predictable until
          <input
            id="predictable_until"
            class="grow"
            name="predictable_until"
            placeholder="Predictable until"
            type="datetime-local"
            value={form?.predictable_until ?? ''}
          />
        </label>

        <label class="input input-bordered flex items-center gap-2">
          Date
          <input
            class="grow"
            id="date"
            name="date"
            placeholder="Date"
            type="date"
            value={form?.date ?? ''}
          />
        </label>

        <label class="input input-bordered flex items-center gap-2">
          Time
          <input
            class="grow"
            id="time"
            name="time"
            placeholder="Time"
            type="time"
            value={form?.time ?? ''}
          />
        </label>

        <div class="grid grid-cols-2">
          <label class="input input-bordered flex items-center gap-2">
            Home id
            <select
              id="home_id"
              name="home_id"
              class="grow select select-bordered"
              value={form?.home_id ?? ''}
            >
              <option disabled selected>Home</option>
              {#each teams as team}
                <option value={team.team_id}>{team.name}</option>
              {/each}
            </select>
          </label>

          <label class="input input-bordered flex items-center gap-2">
            Away id
            <select
              id="away_id"
              name="away_id"
              class="grow select select-bordered"
              value={form?.away_id ?? ''}
            >
              <option disabled selected>Away</option>
              {#each teams as team}
                <option value={team.team_id}>{team.name}</option>
              {/each}
            </select>
          </label>
        </div>
      </div>

      <div class="form-control mt-6">
        <button class="btn btn-primary" class:loading>ADD MATCH</button>
      </div>
    </form>
  </Content>
  <Trigger><button class="m-4 btn btn-primary rounded-btn">Add match</button></Trigger>
</Modal>
{#if !matches || matches.length === 0}
  <div class="mt-8">
    <p class="text-center text-gray-500">No matches found</p>
  </div>
{:else}
  <div
    class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-primary-content"
  >
    {#each matches as match}
      <div class="p-4 card glass rounded-lg shadow-lg text-center">
        <div class="text-lg font-semibold mb-2">
          {#if match?.groupStage}
            Lohko {match.group}
          {:else}
            {match.group}
          {/if}
        </div>
        <div class="text-lg font-semibold mb-2">
          {match.date} - {match.time}
        </div>
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center gap-2">
            <img
              class="h-8 w-8 rounded-full"
              src={`../flags/${match.home.country_code}.svg`}
              alt="{match.home.name} flag"
            />
            <span>{match.home.name}</span>
          </div>

          <div class="text-bold text-lg">
            {#if match?.finished}
              {match.home_goals} - {match.away_goals}
            {:else}
              - : -
            {/if}
          </div>
          <div class="flex items-center gap-2">
            <span>{match.away.name}</span>
            <img
              class="h-8 w-8 rounded-full"
              src={`../flags/${match.away.country_code}.svg`}
              alt="{match.away.name} flag"
            />
          </div>
        </div>
        <div class="flex justify-between items-center">
          <Modal small>
            <Content>
              <form
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
                <div class="form-control mt-5">
                  <input type="hidden" name="match_id" value={match.match_id} />
                  <label class="input input-bordered flex items-center gap-2">
                    Predictable until
                    <input
                      id="predictable_until"
                      class="grow"
                      name="predictable_until"
                      placeholder="Predictable until"
                      type="datetime-local"
                      value={form?.predictable_until ?? match?.predictable_until}
                    />
                  </label>

                  <label class="input input-bordered flex items-center gap-2">
                    Date
                    <input
                      id="date"
                      class="grow"
                      name="date"
                      placeholder="Date"
                      type="date"
                      value={form?.date ?? match?.date}
                    />
                  </label>

                  <label class="input input-bordered flex items-center gap-2">
                    Time
                    <input
                      class="grow"
                      id="time"
                      name="time"
                      placeholder="Time"
                      type="time"
                      value={form?.time ?? match?.time}
                    />
                  </label>

                  <label class="input input-bordered flex items-center gap-2">
                    Home goals
                    <input
                      class="grow"
                      id="home_goals"
                      name="home_goals"
                      placeholder="Home goals"
                      type="number"
                      value={form?.home_goals ?? match?.home_goals}
                    />
                  </label>

                  <label class="input input-bordered flex items-center gap-2">
                    Away goals
                    <input
                      class="grow"
                      id="away_goals"
                      name="away_goals"
                      placeholder="Away goals"
                      type="number"
                      value={form?.away_goals ?? match?.away_goals}
                    />
                  </label>

                  <label class="input input-bordered flex items-center gap-2">
                    Finished
                    <input
                      class="grow"
                      id="finished"
                      name="finished"
                      type="checkbox"
                      value="true"
                      checked={form?.finished ?? match?.finished ?? false}
                    />
                  </label>
                </div>

                <div class="form-control mt-6">
                  <button class="btn btn-primary" class:loading>UPDATE MATCH</button>
                </div>
              </form>
            </Content>
            <Trigger>
              <button class="btn btn-success rounded-btn">EDIT</button>
            </Trigger>
          </Modal>
          <form
            method="POST"
            action="?/delete"
            use:enhance={() => {
              loading = true;
              return async ({ result, update }) => {
                update();
                loading = false;
              };
            }}
          >
            <input type="hidden" name="match_id" value={match.match_id} />
            <button class="btn btn-error rounded-btn">DELETE</button>
          </form>
        </div>
      </div>
    {/each}
  </div>
{/if}
