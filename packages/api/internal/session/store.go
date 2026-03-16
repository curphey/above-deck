package session

type Store interface {
	Save(session *Session) error
	Load(id string) (*Session, error)
}

type InMemoryStore struct{}

func (s *InMemoryStore) Save(session *Session) error     { return nil }
func (s *InMemoryStore) Load(id string) (*Session, error) { return nil, nil }
