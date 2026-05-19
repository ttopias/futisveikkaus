<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
</script>

<div class="flex w-full justify-center px-4 py-8">
  <Card.Root class="w-full max-w-lg shadow-md">
    <Card.Header>
      <Card.Title>Lähetimme sähköpostiisi linkin</Card.Title>
      <p class="text-sm text-muted-foreground">
        Tarkista roskaposti, jos viesti ei näy muutamassa minuutissa.
      </p>
    </Card.Header>
    <Card.Footer>
      <a href="/">
        <Button variant="outline" type="button">Palaa etusivulle</Button>
      </a>
    </Card.Footer>
  </Card.Root>
</div>
