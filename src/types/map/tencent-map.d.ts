/** 腾讯地图 GL JS SDK 最小类型声明 */
declare namespace TMap {
  class LatLng {
    constructor(lat: number, lng: number)
    getLat(): number
    getLng(): number
  }

  interface MapOptions {
    center: LatLng
    zoom: number
    viewMode?: string
  }

  class Map {
    constructor(container: string | HTMLElement, options: MapOptions)
    on(event: string, handler: (evt: MapClickEvent) => void): void
    off(event: string, handler: (evt: MapClickEvent) => void): void
    setCenter(center: LatLng): void
    destroy(): void
  }

  interface MapClickEvent {
    latLng: LatLng
  }

  interface MultiMarkerGeometry {
    id: string
    styleId?: string
    position: LatLng
  }

  interface MarkerStyleAnchor {
    x: number
    y: number
  }

  interface MarkerStyleOptions {
    width: number
    height: number
    anchor: MarkerStyleAnchor
    src?: string
  }

  class MarkerStyle {
    constructor(options: MarkerStyleOptions)
  }

  interface MultiMarkerOptions {
    map: Map
    styles?: Record<string, MarkerStyle>
    geometries: MultiMarkerGeometry[]
  }

  class MultiMarker {
    constructor(options: MultiMarkerOptions)
    updateGeometries(geometries: MultiMarkerGeometry[]): void
    setMap(map: Map | null): void
  }

  namespace service {
    interface GeocodeResult {
      result?: {
        address?: string
        location?: LatLng
      }
    }

    interface SuggestionItem {
      title?: string
      address?: string
      location?: LatLng
    }

    interface SuggestionResult {
      data?: SuggestionItem[]
    }

    class Geocoder {
      getAddress(options: { location: LatLng }): Promise<GeocodeResult>
      getLocation(options: { address: string }): Promise<GeocodeResult>
    }

    class Suggestion {
      constructor(options?: { pageSize?: number })
      getSuggestions(options: { keyword: string; location?: LatLng }): Promise<SuggestionResult>
    }
  }
}

interface Window {
  TMap?: typeof TMap
}
