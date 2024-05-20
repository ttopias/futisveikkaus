<script lang="ts">
  import SvelteTable from 'svelte-table';
  import { enhance } from '$app/forms';
  import { DashboardPage, RoleBadge, TableActions, TimeInTable } from '$lib/index';
  import { roleAdmin } from '$lib/utils';
  import { PlusIcon, UsersIcon, XIcon } from 'svelte-feather-icons';
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;
  let loading = false;
  let view = 'home';

  $: {
    if (form?.success) {
      view = 'home';
    }
    if (form?.error) {
      loading = false;
      console.log(form.error);
    }
  }

  let disabled = true;
  let password = '';
  let password2 = '';

  $: {
    if (password == password2) {
      disabled = false;
    } else {
      disabled = true;
    }
  }

  const columns = [
    {
      key: 'email',
      title: 'EMAIL',
      value: (v: any) => v.email,
      sortable: true,
    },
    {
      key: 'role',
      title: 'ROLE',
      value: (v: any) => v.user_metadata?.role,
      renderComponent: RoleBadge,
      sortable: true,
    },
    {
      key: 'first_name',
      title: 'FIRST NAME',
      value: (v: any) => v.user_metadata?.first_name,
      sortable: true,
    },
    {
      key: 'created',
      title: 'CREATED',
      value: (v: any) => v.created_at,
      sortable: true,
      renderComponent: {
        component: TimeInTable,
        props: { field: 'created_at', format: 'DD-MM-YYYY HH:mm' },
      },
    },
    {
      key: 'last',
      title: 'LAST SEEN',
      value: (v: any) => v.last_sign_in_at,
      sortable: true,
      renderComponent: {
        component: TimeInTable,
        props: { field: 'last_sign_in_at', format: 'DD-MM-YYYY HH:mm' },
      },
    },
    {
      key: 'actions',
      title: '',
      renderComponent: {
        component: TableActions,
      },
    },
  ];
</script>

{#if view == 'home'}
  <DashboardPage>
    <span slot="icon"><UsersIcon /></span>
    <span slot="title">Users</span>

    <span slot="actions">
      <button
        class="btn btn-warning"
        on:click={() => {
          view = 'add';
        }}
      >
        <PlusIcon />
      </button>
    </span>

    <span slot="content" class="w-full">
      <div class="card flex-col lg:flex-row bg-base-300 shadow-xl">
        <div
          class="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-gray-400 overflow-y-scroll"
        >
          {#if !data?.users || data.users.length == 0}
            <div class="text-center text-2xl mt-5">No users found</div>
          {:else}
            <SvelteTable
              {columns}
              rows={data.users}
              classNameTable={'table table-compact table-zebra'}
              classNameThead={'bg-black'}
            />
          {/if}
        </div>
      </div>
    </span>
  </DashboardPage>
{:else if (view = 'add')}
  <DashboardPage>
    <span slot="icon"> <PlusIcon /></span>
    <span slot="title"> Add user </span>
    <span slot="actions">
      <button
        class="btn btn-danger"
        on:click={() => {
          view = 'home';
        }}
      >
        <XIcon />
      </button>
    </span>

    <span slot="content" class="w-full h-full">
      <form
        method="POST"
        action="?/create"
        use:enhance={() => {
          loading = true;
          return async ({ result, update }) => {
            update();
            // console.log(result);
            if (result.type == 'failure') {
              loading = false;
            }
          };
        }}
      >
        <div class="form-control mt-5">
          <label class="input-group">
            <span class="w-1/5 text-xl bg-primary">Email</span>
            <input
              id="email"
              name="email"
              class="w-4/5 input input-bordered"
              type="email"
              placeholder="email"
              value={form?.email ?? ''}
              required
            />
          </label>
        </div>

        <div class="form-control mt-5">
          <label class="input-group">
            <span class="w-1/5 text-xl bg-primary">Name</span>
            <input
              id="first_name"
              name="first_name"
              class="w-4/5 input input-bordered"
              type="text"
              placeholder="First name"
              value={form?.first_name ?? ''}
              required
            />
          </label>
        </div>

        <div class="form-control mt-5">
          <label class="input-group">
            <span class="w-1/5 text-xl bg-primary">Role</span>
            <select
              id="role"
              name="role"
              class="w-4/5 select select-bordered"
              value={form?.role ?? ''}
              required
            >
              <option disabled selected>Role</option>
              <option value="user">User</option>
              {#if roleAdmin(data.user)}
                <option value="admin">Admin</option>
              {/if}
            </select>
          </label>
        </div>

        <div class="form-control mt-5">
          <label class="input-group">
            <span class="w-1/5 text-xl bg-primary">Password</span>
            <input
              autocomplete="current-password"
              id="password"
              name="password"
              class="w-4/5 input input-bordered"
              type="password"
              placeholder="enter password"
              required
            />
          </label>
        </div>

        <div class="form-control mt-5">
          <label class="input-group">
            <span class="w-1/5 text-xl bg-primary">Confirm</span>
            <input
              autocomplete="current-password"
              id="password"
              name="password"
              class="w-4/5 input input-bordered"
              type="password"
              placeholder="confirm password"
              required
            />
          </label>
        </div>

        <div class="form-control mt-6">
          <button class:btn-disabled={disabled} class="btn btn-primary" class:loading
            >ADD USER</button
          >
        </div>
      </form>
    </span>
  </DashboardPage>
{/if}
