<script lang="ts">
  import { enhance } from '$app/forms';
  import { Content, Modal, Trigger } from '$lib/index';
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;
  let loading = false;
</script>

<Modal small>
  <Content class="glass card rounded-btn pt-2">
    <div class="card-title justify-center">Add Team</div>
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
      <div class="form-control card-body">
        {#if form?.error}
          <div class="alert alert-error">{form.error}</div>
        {/if}

        <label class="input input-bordered flex items-center gap-2">
          <span class="">ISO 3166 code</span>
          <input
            id="country_code"
            name="country_code"
            class="grow"
            placeholder="de"
            type="text"
            value={form?.country_code ?? ''}
          />
        </label>

        <label class="input input-bordered flex items-center gap-2">
          <span class="">Name</span>
          <input
            id="name"
            name="name"
            class="grow"
            placeholder="Germany"
            type="text"
            value={form?.name ?? ''}
          />
        </label>

        <label class="input input-bordered flex items-center gap-2">
          <span class="">Group</span>
          <input
            id="group"
            name="group"
            class="grow"
            placeholder="A"
            type="text"
            value={form?.group ?? ''}
          />
        </label>
      </div>
      <div class="form-control mx-4 mb-4">
        <button type="submit" class="btn btn-primary" class:loading>ADD TEAM</button>
      </div>
    </form>
  </Content>
  <Trigger><button class="my-2 btn btn-primary rounded-btn">Add team</button></Trigger>
</Modal>
{#if !data?.teams || Object.keys(data?.teams).length === 0}
<p>No teams found</p>
{:else}
<div
class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-primary-content"
>
    {#each Object.keys(data?.teams) as group}
      <div class="card w-96 glass card-bordered card-compact my-4 pt-4 shadow-xl">
        <div class="pt-1 card-title justify-center">Lohko {group}</div>
        <div class="card-body">
          {#each data?.teams[group] as team}
            <Modal small>
              <Content class="glass w-full rounded-btn p-4">
                <form
                  method="POST"
                  action="?/update"
                  use:enhance={() => {
                    loading = true;
                    return async ({ result, update }) => {
                      update();
                      loading = false;
                    };
                  }}
                >
                  <div class="form-control">
                    {#if form?.error}
                      <div class="alert alert-error">{form.error}</div>
                    {/if}
                    <input type="hidden" name="team_id" value={team?.team_id} />

                    <label class="input input-bordered flex items-center gap-2">
                      <span class="">Country code</span>
                      <input
                        id="country_code"
                        name="country_code"
                        class="grow"
                        placeholder="Country code"
                        type="text"
                        value={form?.country_code ?? team.country_code}
                      />
                    </label>

                    <label class="input input-bordered flex items-center gap-2">
                      <span class="">Name</span>
                      <input
                        id="name"
                        name="name"
                        class="grow"
                        placeholder="Name"
                        type="text"
                        value={form?.name ?? team?.name}
                      />
                    </label>

                    <label class="input input-bordered flex items-center gap-2">
                      <span class="">Group</span>
                      <input
                        id="group"
                        name="group"
                        class="grow"
                        placeholder="group"
                        type="text"
                        value={form?.group ?? team?.group}
                      />
                    </label>

                    <label class="input input-bordered flex items-center gap-2">
                      <span class="">Wins</span>
                      <input
                        id="win"
                        name="win"
                        class="grow"
                        placeholder="win"
                        type="number"
                        value={form?.win ?? team?.win}
                      />
                    </label>

                    <label class="input input-bordered flex items-center gap-2">
                      <span class="">Draws</span>
                      <input
                        id="draw"
                        name="draw"
                        class="grow"
                        placeholder="draw"
                        type="number"
                        value={form?.draw ?? team?.draw}
                      />
                    </label>

                    <label class="input input-bordered flex items-center gap-2">
                      <span class="">Wins</span>
                      <input
                        id="loss"
                        name="loss"
                        class="grow"
                        placeholder="loss"
                        type="number"
                        value={form?.loss ?? team?.loss}
                      />
                    </label>

                    <label class="input input-bordered flex items-center gap-2">
                      <span class="">Goals for</span>
                      <input
                        id="gf"
                        name="gf"
                        class="grow"
                        placeholder="gf"
                        type="number"
                        value={form?.gf ?? team?.gf}
                      />
                    </label>

                    <label class="input input-bordered flex items-center gap-2">
                      <span class="">Goals against</span>
                      <input
                        id="gaa"
                        name="gaa"
                        class="grow"
                        placeholder="gaa"
                        type="number"
                        value={form?.gaa ?? team?.gaa}
                      />
                    </label>
                  </div>

                  <div class="form-control mt-4 mb-4">
                    <button type="submit" class="btn btn-primary" class:loading>UPDATE TEAM</button>
                  </div>
                </form>
              </Content>
              <Trigger>
                <div class="card-actions items-center gap-1">
                  <img
                    class="flag h-6 w-9"
                    src={`../flags/${team.country_code}.svg`}
                    alt="{team.name} flag"
                  />
                  {team.name}
                </div>
              </Trigger>
            </Modal>
          {/each}
        </div>
      </div>
    {/each}
  </div>
  {/if}
