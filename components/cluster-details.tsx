import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Newspaper } from "lucide-react"

interface ClusterDetailsProps {
  cluster: {
    id: number
    title: string
    description: string
    imageCount: number
    dateRange: string
    publications: string[]
    tags: string[]
  }
}

export function ClusterDetails({ cluster }: ClusterDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{cluster.title}</CardTitle>
        <CardDescription>{cluster.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{cluster.dateRange}</span>
          </div>

          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-1">
              {cluster.publications.map((pub, index) => (
                <Badge key={index} variant="outline">
                  {pub}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Related Topics</h4>
            <div className="flex flex-wrap gap-1">
              {cluster.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
