<script lang="ts">
  import { enhance } from '$app/forms';
  import { Content, Modal, Trigger } from '$lib/index';
  import type { Match, Team } from '$lib/index';
  import { matchParticipant } from '$lib/match-participants';
  import TeamFlag from '$lib/components/TeamFlag.svelte';
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;
  let matches: Match[] = data?.matches ?? [];
  let teams: Team[] = data?.teams ?? [];

  let loading = false;

  function toDatetimeLocal(iso?: string | null) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
</script>

<Modal small>
  <Content class="card glass p-4 text-primary-content">
    <div class="card-title justify-center">Add Match</div>
    <form
      method="POST"
      action="?/create"
      use:enhance={() => {
        loading = true;
        return async ({ update }) => {
          update();
          loading = false;
        };
      }}
    >
      <div class="form-control">
        <label class="input input-bordered flex items-center gap-2">
          Kickoff
          <input
            id="starts_at"
            class="grow"
            name="starts_at"
            placeholder="Kickoff"
            type="datetime-local"
            value={toDatetimeLocal(form?.starts_at) ?? ''}
            required
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
          {new Date(match.starts_at).toLocaleString('fi-FI')}
        </div>
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center gap-2">
            <TeamFlag
              countryCode={matchParticipant(match, 'home').country_code}
              name={matchParticipant(match, 'home').name}
              width={32}
              height={32}
              class="h-8 w-8 rounded-full object-cover"
            />
            <span>{matchParticipant(match, 'home').name}</span>
          </div>

          <div class="text-bold text-lg">
            {#if match?.finished}
              {match.home_goals} - {match.away_goals}
            {:else}
              - : -
            {/if}
          </div>
          <div class="flex items-center gap-2">
            <span>{matchParticipant(match, 'away').name}</span>
            <TeamFlag
              countryCode={matchParticipant(match, 'away').country_code}
              name={matchParticipant(match, 'away').name}
              width={32}
              height={32}
              class="h-8 w-8 rounded-full object-cover"
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
                  return async ({ update }) => {
                    update();
                    loading = false;
                  };
                }}
              >
                <div class="form-control mt-5">
                  <input type="hidden" name="match_id" value={match.match_id} />
                  <label class="input input-bordered flex items-center gap-2">
                    Kickoff
                    <input
                      id="starts_at"
                      class="grow"
                      name="starts_at"
                      placeholder="Kickoff"
                      type="datetime-local"
                      value={toDatetimeLocal(form?.starts_at ?? match?.starts_at)}
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
              return async ({ update }) => {
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
