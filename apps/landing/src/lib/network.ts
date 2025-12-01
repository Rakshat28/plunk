import {API_URI} from './constants';
import {infer as ZodInfer, ZodSchema} from 'zod';

interface Json {
  [x: string]: string | number | boolean | Date | Json | JsonArray;
}

type JsonArray = (string | number | boolean | Date | Json | JsonArray)[];

interface TypedSchema extends ZodSchema {
  _type: unknown;
}

export class network {
  /**
   * Fetcher function that includes toast support
   * @param method Request method
   * @param path Request endpoint or path
   * @param body Request body
   */
  public static async fetch<T, Schema extends TypedSchema | void = void>(
    method: 'GET' | 'PUT' | 'POST' | 'DELETE',
    path: string,
    body?: Schema extends TypedSchema ? ZodInfer<Schema> : never,
  ): Promise<T> {
    const url = path.startsWith('http') ? path : API_URI + path;
    const response = await fetch(url, {
      method,
      body: body && JSON.stringify(body),
      headers: body && {'Content-Type': 'application/json'},
      credentials: 'include',
    });

    const res = await response.json();

    if (response.status >= 400) {
       
      throw new Error(res?.message ?? 'Something went wrong!');
    }

    return res;
  }
}
