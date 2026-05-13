type GenericObject = Record<string, unknown>;

export class ServiceStore {
   static instance: ServiceStore | null = null;
   static responseMap = new Map<string, GenericObject>();

   static getInstance(): ServiceStore {
      if (ServiceStore.instance === null) {
         ServiceStore.instance = new ServiceStore();
      }
      return ServiceStore.instance;
   }

   private buildKey(serviceName: string, key: string): string {
      return `ServiceName-${serviceName}-key-${key}`;
   }

   insert(serviceName: string, key: string, response: GenericObject): void {
      ServiceStore.responseMap.set(this.buildKey(serviceName, key), response);
   }

   get(serviceName: string, key: string): GenericObject | undefined {
      return ServiceStore.responseMap.get(this.buildKey(serviceName, key));
   }

   remove(serviceName: string, key: string): boolean {
      return ServiceStore.responseMap.delete(this.buildKey(serviceName, key));
   }

   clear(): void {
      ServiceStore.responseMap.clear();
   }
}
